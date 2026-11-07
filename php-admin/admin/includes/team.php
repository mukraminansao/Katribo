<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/../../includes/shop-error.php';

function admin_team_list(): array
{
    return admin_state(function (array &$state): array {
        $users = $state['users'] ?? [];
        $owner = $state['owner'];
        if ($owner) array_unshift($users, $owner + ['role' => 'owner', 'active' => true, 'version' => 1]);
        return array_values(array_map(static fn(array $user): array => array_intersect_key($user, array_flip(['id', 'name', 'email', 'role', 'active', 'version', 'created_at', 'last_login_at'])), $users));
    });
}

/** Only the owner can call this; account changes revoke existing sessions immediately. */
function admin_team_save(array $actor, array $input): array
{
    if (!admin_can($actor, 'manage-team')) throw new ShopError(403, 'Only the owner can manage team accounts.');
    $id = $input['id'] ?? null;
    $name = is_string($input['name'] ?? null) ? trim($input['name']) : '';
    $email = is_string($input['email'] ?? null) ? strtolower(trim($input['email'])) : '';
    $password = $input['password'] ?? '';
    $role = $input['role'] ?? null; $active = $input['active'] ?? null;
    if (($id !== null && (!is_string($id) || !preg_match('/^[a-f0-9]{32}$/D', $id))) || !is_string($password) || !in_array($role, ['manager', 'staff'], true) || !is_bool($active)) throw new ShopError(422, 'Choose a valid staff or manager account.');
    if (mb_strlen($name) < 2 || mb_strlen($name) > 80 || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) throw new ShopError(422, 'Enter a name of 2–80 characters and a valid email address.');
    if (($id === null || $password !== '') && admin_account_errors($name, $email, $password, $password)) throw new ShopError(422, 'Use a passphrase of at least 12 characters and at most 72 bytes.');
    $hash = $password !== '' ? password_hash($password, PASSWORD_DEFAULT) : null;
    admin_state(function (array &$state) use ($actor, $input, $id, $name, $email, $role, $active, $hash): void {
        if (!$state['owner'] || !hash_equals($state['owner']['id'], $actor['id'])) throw new ShopError(403, 'Only the owner can manage team accounts.');
        if ($id === $state['owner']['id']) throw new ShopError(422, 'The owner account cannot be changed from team management.');
        $users = $state['users'] ?? [];
        foreach ([$state['owner'], ...array_values($users)] as $user) if ($user['id'] !== $id && $user['email'] === $email) throw new ShopError(422, 'That email address is already in use.');
        if ($id !== null && (!isset($users[$id]) || !is_int($input['version'] ?? null) || ($users[$id]['version'] ?? 1) !== $input['version'])) throw new ShopError(409, 'This team account changed elsewhere. Refresh before saving.');
        if ($id === null && count($users) >= 50) throw new ShopError(422, 'The team limit is 50 accounts. Reuse or reactivate an existing account.');
        $key = $id ?? bin2hex(random_bytes(16)); $existing = $users[$key] ?? [];
        $users[$key] = ['id' => $key, 'name' => $name, 'email' => $email, 'role' => $role, 'active' => $active, 'hash' => $hash ?? $existing['hash'], 'auth_version' => bin2hex(random_bytes(16)), 'version' => ($existing['version'] ?? 0) + 1, 'created_at' => $existing['created_at'] ?? time()];
        if (isset($existing['last_login_at'])) $users[$key]['last_login_at'] = $existing['last_login_at'];
        $state['users'] = $users;
    }, true);
    return admin_team_list();
}
