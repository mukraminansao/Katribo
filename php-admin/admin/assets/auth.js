document.querySelector('[data-show-password]')?.addEventListener('change', event => {
  document.querySelectorAll('input[name="password"], input[name="confirm"]').forEach(input => {
    input.type = event.target.checked ? 'text' : 'password';
  });
});
