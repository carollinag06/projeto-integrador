const API_URL = "http://localhost:3000/pratos"; // URL da sua API

let editId = null;

// Função chamada quando a página é carregada
window.onload = carregarPratos;

// Função para enviar dados do prato para o back-end
async function criarPrato() {
  const nome = document.getElementById("nome").value;
  const preco = document.getElementById("preco").value;
  const descricao = document.getElementById("descricao").value;
  const modo_preparo = document.getElementById("modo_preparo").value;
  const tipo = document.getElementById("tipo").value;
  const promocaoCheckbox = document.getElementById("promocao");
  const promocao = promocaoCheckbox.checked;
  const imagem = document.getElementById("imagem").files[0];


  if (!nome || !preco || !descricao || !modo_preparo || !tipo || !imagem) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  // ----------- FORM DATA (envio correto com arquivo) ------------
  const formData = new FormData();
  formData.append("nome", nome);
  formData.append("preco", preco);
  formData.append("descricao", descricao);
  formData.append("modo_preparo", modo_preparo);
  formData.append("tipo", tipo);
  formData.append("promocao", promocao);
  if (imagem) formData.append("imagem", imagem);

  let url = API_URL;
  let method = "POST";

  if (editId) {
    url = API_URL + "/" + editId;
    method = "PUT";
  }

  try {
    const response = await fetch(url, {
      method,
      body: formData
    });

    if (response.ok) {
      limparCampos();
      carregarPratos();
    } else {
      const erro = await response.json().catch(() => ({}));
      alert("Erro ao salvar o prato: " + (erro.erro || response.statusText));
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
    alert("Erro de conexão ao salvar o prato");
  }
}

// Função para carregar a lista de pratos
async function carregarPratos() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    console.error("Erro na requisição:", response.status);
    alert("Erro ao carregar pratos");
    return;
  }

  const pratos = await response.json();

  // Validar se é um array
  if (!Array.isArray(pratos)) {
    console.error("Resposta não é um array:", pratos);
    alert("Erro: Dados inválidos recebidos do servidor");
    return;
  }

  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  pratos.forEach(p => {
    lista.innerHTML += `
                <div class="prato-card">
                    <img src="${p.imagem}" alt="Imagem do prato">

                    <div style="flex:1">
                        <b>${p.nome}</b><br>
                        R$ ${p.preco}<br>
                        <b>${p.tipo}</b> <br>
                        <small>${p.descricao}</small>
                    </div>

                    <div class="acoes">
                        <button onclick='editarPrato(${JSON.stringify(p)})'>Editar</button>
                        <button onclick='removerPrato(${p.idPratos})'>Excluir</button>
                    </div>
                </div>
            `;
  });
}

// Função para editar um prato
function editarPrato(p) {
  editId = p.idPratos;
  document.getElementById("nome").value = p.nome;
  document.getElementById("preco").value = p.preco;
  document.getElementById("descricao").value = p.descricao;
  document.getElementById("modo_preparo").value = p.modo_preparo;
  document.getElementById("tipo").value = p.tipo;

  document.getElementById("btnSalvar").innerText = "Salvar Alterações";
}

// Função para excluir um prato
async function removerPrato(idPratos) {
  const response = await fetch(API_URL + "/" + idPratos, { method: "DELETE" });

  if (response.ok) {
    carregarPratos(); // Recarrega a lista de pratos após a exclusão
  } else {
    alert("Ocorreu um erro ao excluir o prato.");
  }
}

// Função para limpar os campos do formulário
function limparCampos() {
  editId = null;
  document.getElementById("nome").value = "";
  document.getElementById("preco").value = "";
  document.getElementById("descricao").value = "";
  document.getElementById("modo_preparo").value = "";
  document.getElementById("imagem").value = "";
  document.getElementById("btnSalvar").innerText = "Adicionar Prato";
}

document.getElementById('preco').addEventListener('keypress', function (e) {
  const char = String.fromCharCode(e.keyCode);
  if (!char.match(/^[0-9.,]$/)) {
    e.preventDefault();
    return false;
  }
});
