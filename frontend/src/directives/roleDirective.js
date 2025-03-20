export default {
  mounted(el, binding) {
    const user = JSON.parse(localStorage.getItem("user"));

    const allowedUsers = binding.value;

    // Se o usuário autenticado NÃO estiver na lista, remove o elemento
    if (!allowedUsers.includes(user.category)) {
      el.remove();
    }
  },
};
