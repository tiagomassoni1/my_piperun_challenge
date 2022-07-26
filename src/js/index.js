let activiesCacheMap;

async function loadActivities(filterDt) {
  document.querySelector("tbody").innerHTML = "";

  const typeMap = await getActivityTypes();
  const statusMap = getStatus();
  let url = "https://api.pipe.run/v1/activities?show=30";
  if (filterDt) {
    const initialDate = document.getElementById("firstDate").value;
    const finalDate = document.getElementById("lastDate").value;
    url += `&created_at_start=${initialDate}&created_at_end=${finalDate}`;
  }
  fetch(url, {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      Token: sessionStorage.getItem("token"),
    },
  })
    .then((response) => response.json())
    .then((response) => {
      activiesCacheMap = new Map();
      response.data.forEach((item) => {
        activiesCacheMap.set(item.id, item);
        fetch("https://api.pipe.run/v1/users?id=" + item.owner_id, {
          method: "get",
          headers: {
            "Content-Type": "application/json",
            Token: sessionStorage.getItem("token"),
          },
        })
          .then((responseUsers) => responseUsers.json())
          .then((responseUsers) =>
            insertTableItem(
              {
                title: item.title,
                resp: responseUsers.data[0].name,
                tipo: typeMap.get(item.activity_type_id),
                status: statusMap.get(item.status),
              },
              item.id
            )
          );
      });
    });
}

async function getActivityTypes() {
  return new Promise((resolve) => {
    const typeMap = new Map();
    fetch("https://api.pipe.run/v1/activityTypes", {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Token: sessionStorage.getItem("token"),
      },
    })
      .then((response) => response.json())
      .then((response) => {
        response.data.forEach((type) => {
          typeMap.set(type.id, type.name);
        });
        resolve(typeMap);
      });
  });
}

function getStatus() {
  const statusMap = new Map();
  statusMap.set(0, "Aberta");
  statusMap.set(1, "Indiferente");
  statusMap.set(2, "Concluída");
  statusMap.set(4, "Não Compareceu");
  return statusMap;
}

function editItem(id) {
  if (id) {
    const activity = activiesCacheMap.get(id);
    document.getElementById("m-title").value = activity.title;
    document.getElementById("m-resp").value = activity.owner_id;
    document.getElementById("m-tipo").value = activity.activity_type_id;
    document.getElementById("m-status").value = activity.status;
  }
  const modal = document.querySelector(".modal-container");
  modal.classList.add("active");

  modal.onclick = (e) => {
    if (e.target.className.indexOf("modal-container") !== -1) {
      modal.classList.remove("active");
    }
  };
}

function insertTableItem(item, id) {
  const tbody = document.querySelector("tbody");
  let tr = document.createElement("tr");
  tr.setAttribute("id", "row_" + id);
  tr.innerHTML = `
    <td>${item.title}</td>
    <td>${item.resp}</td>
    <td>${item.tipo}</td>
    <td>${item.status}</td>
    <td class="acao">
      <button onclick="changeStatus(${id})"><i class='bx bx-check-square'></i></button>
    </td>
    <td class="acao">
      <button onclick="editItem(${id})"><i class='bx bx-edit' ></i></button>
    </td>
    <td class="acao">
      <button onclick="removeActivities(${id})"><i class='bx bx-trash'></i></button>
    </td>
  `;
  tbody.appendChild(tr);
}

function removeActivities(id) {
  fetch("https://api.pipe.run/v1/activities/" + id, {
    method: "delete",
    headers: {
      "Content-Type": "application/json",
      Token: sessionStorage.getItem("token"),
    },
  }).then(() => loadActivities(false));
}

function saveActivity(id) {
  const titleValue = document.getElementById("m-title").value;
  const respValue = document.getElementById("m-resp").value;
  const typeValue = document.getElementById("m-tipo").value;
  const statusValue = document.getElementById("m-status").value;

  if (id) {
    fetch("https://api.pipe.run/v1/activities/" + respValue, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Token: sessionStorage.getItem("token"),
      },
      body: JSON.stringify({
        title: titleValue,
        activity_type_id: typeValue,
        priority: 3,
        status: statusValue,
        owner_id: respValue,
      }),
    }).then(() =>{
      loadActivities(false)
      document.querySelector(".modal-container").classList.remove("active")
    }
    );
  } else {
    fetch("https://api.pipe.run/v1/activities", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Token: sessionStorage.getItem("token"),
      },
      body: JSON.stringify({
        title: titleValue,
        activity_type_id: typeValue,
        status: statusValue,
        owner_id: respValue,
      }),
    }).then((response) => {
      if (response.status === 201) {
        document.getElementById("m-title").value = "";
        document.getElementById("m-resp").value = "";
        document.getElementById("m-tipo").value = "";
        document.getElementById("m-status").value = "";
        document.querySelector(".modal-container").classList.remove("active");
        loadActivities(false);
      } else if (response.status === 422) {
        alert("Status de entidade não processável, por favor entre com como: Aberto")
      }
    });
  }
}

function addOption(component, item) {
  const option = document.createElement("option");
  option.value = item.id;
  option.text = item.name;
  component.add(option);
}

async function loadTypeActivitiesOptions() {
  const select = document.getElementById("m-tipo");
  const typeMap = await getActivityTypes();
  typeMap.forEach((item, key) => {
    addOption(select, { id: key, name: item });
  });
}

function loadUsersOptions() {
  fetch("https://api.pipe.run/v1/users", {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      Token: sessionStorage.getItem("token"),
    },
  })
    .then((responseUsers) => responseUsers.json())
    .then((responseUsers) => {
      const select = document.getElementById("m-resp");
      responseUsers.data.forEach((user) => {
        addOption(select, { id: user.id, name: user.name });
      });
    });
}

async function loadStatusOptions() {
  const select = document.getElementById("m-status");
  const statusMap = getStatus();
  statusMap.forEach((item, key) => {
    addOption(select, { id: key, name: item });
  });
}

function changeStatus(id) {
  const activity = activiesCacheMap.get(id);
  fetch("https://api.pipe.run/v1/activities/" + id, {
    method: "put",
    headers: {
      "Content-Type": "application/json",
      Token: sessionStorage.getItem("token"),
    },
    body: JSON.stringify({
      activity_type_id: activity.activity_type_id,
      priority: 3,
      status: 2,
      owner_id: activity.owner_id,
    }),
  }).then(() => loadActivities(false));
}

loadActivities(false);
loadTypeActivitiesOptions();
loadUsersOptions();
loadStatusOptions();

if (!sessionStorage.getItem("token")) {
  location.href = "login.html";
}

function logout(){
  delete window.sessionStorage.token;
  return location.href = "login.html"
}