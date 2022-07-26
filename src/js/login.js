function validForm() {
  const user = document.getElementById("username");
  if (
    user.value ||
    user.value.indexOf("@") == -1 ||
    user.value.indexOf(".") == -1
  ) {
    errorMsg("Usuário ou senha inválidos!");
    return false;
  }
  return true;
}

function errorMsg(msg) {
  const errorMsg = document.getElementById("error-msg");
  errorMsg.innerHTML = msg;
  errorMsg.style.display = "block";
}

function handleLogin(event) {
  if (!validForm) {
    return;
  }
  const user = document.getElementById("username");
  const password = document.getElementById("password");
  
  fetch("https://api.pipe.run/v1/auth", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.value,
      password: password.value,
    }),
  })
    .then((response) => response.json())
    .then((response) => {
      if (!response.success) {
        errorMsg('Usuário e/ou Senha inválido!');
      } else {
        sessionStorage.setItem("token", response.data.me.token);
        location.href = "index.html";
      }
      console.log(response);
    })
    .catch((error) => console.log(error));
    event.preventDefault();
}
