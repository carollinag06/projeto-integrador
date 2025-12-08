
const API_URL = "http://localhost:3000/usuarios";
let usuariosCache = []; // Para guardar a lista e filtrar localmente

// 1. INICIALIZAÇÃO
window.onload = carregarUsuarios;

// 2. BUSCAR USUÁRIOS
async function carregarUsuarios() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Erro ao buscar");

    usuariosCache = await res.json();
    renderizarTabela(usuariosCache);
  } catch (error) {
    console.error(error);
    document.getElementById('tabela-usuarios').innerHTML = `<tr><td colspan="6" style="text-align:center; color:red">Erro ao carregar usuários. Verifique o servidor.</td></tr>`;
  }
}

// 3. RENDERIZAR TABELA
function renderizarTabela(lista) {
  const tbody = document.getElementById('tabela-usuarios');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#777">Nenhum usuário encontrado.</td></tr>`;
    return;
  }

  lista.forEach(u => {
    // Define etiqueta do tipo
    const tipoLabel = u.tipoUsuario == 2
      ? '<span class="badge badge-admin">Admin</span>'
      : '<span class="badge badge-cliente">Cliente</span>';

    // Formata objeto para passar no onclick (segurança básica de aspas)
    const userString = encodeURIComponent(JSON.stringify(u));

    tbody.innerHTML += `
                    <tr>
                        <td>#${u.id}</td>
                        <td><b>${u.nome || 'Sem nome'}</b></td>
                        <td>${u.email || '-'}</td>
                        <td>${u.telefone || '-'}</td>
                        <td>${tipoLabel}</td>
                        <td class="actions">
                            <button class="btn-icon edit" onclick="prepararEdicao('${userString}')" title="Editar">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="btn-icon del" onclick="deletarUsuario(${u.id})" title="Excluir">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </td>
                    </tr>
                `;
  });
}

// 4. FILTRAR (BUSCA)
function filtrarUsuarios() {
  const termo = document.getElementById('inputBusca').value.toLowerCase();
  const filtrados = usuariosCache.filter(u =>
    (u.nome && u.nome.toLowerCase().includes(termo)) ||
    (u.email && u.email.toLowerCase().includes(termo))
  );
  renderizarTabela(filtrados);
}

// 5. MODAL LOGIC
function abrirModal() {
  document.getElementById('modalUsuario').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('modalUsuario').style.display = 'none';
  limparFormulario();
}

function limparFormulario() {
  document.getElementById('userId').value = '';
  document.getElementById('nome').value = '';
  document.getElementById('email').value = '';
  document.getElementById('senha').value = '';
  document.getElementById('telefone').value = '';
  document.getElementById('tipoUsuario').value = '1';
  document.getElementById('modalTitulo').innerText = 'Novo Usuário';
}

// 6. PREPARAR EDIÇÃO
function prepararEdicao(userEncoded) {
  const u = JSON.parse(decodeURIComponent(userEncoded));

  document.getElementById('userId').value = u.id;
  document.getElementById('nome').value = u.nome;
  document.getElementById('email').value = u.email;
  document.getElementById('senha').value = u.senha; // Mostra a senha atual (cuidado em produção real)
  document.getElementById('telefone').value = u.telefone;
  document.getElementById('tipoUsuario').value = u.tipoUsuario || 1;

  document.getElementById('modalTitulo').innerText = 'Editar Usuário';
  abrirModal();
}

// 7. SALVAR (CREATE / UPDATE)
async function salvarUsuario() {
  const id = document.getElementById('userId').value;
  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const telefone = document.getElementById('telefone').value;
  const tipoUsuario = document.getElementById('tipoUsuario').value;

  if (!nome || !email || !senha) {
    Swal.fire("Atenção", "Preencha Nome, Email e Senha.", "warning");
    return;
  }

  const payload = { nome, email, senha, telefone, tipoUsuario };
  let url = API_URL;
  let method = "POST";

  if (id) {
    url = `${API_URL}/${id}`;
    method = "PUT";
  }

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      fecharModal();
      Swal.fire("Sucesso", "Usuário salvo com sucesso!", "success");
      carregarUsuarios();
    } else {
      const erro = await res.json();
      Swal.fire("Erro", erro.erro || "Falha ao salvar", "error");
    }
  } catch (error) {
    Swal.fire("Erro", "Falha na conexão", "error");
  }
}

// 8. DELETAR
function deletarUsuario(id) {
  Swal.fire({
    title: 'Tem certeza?',
    text: "Essa ação não pode ser desfeita!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire('Excluído!', 'Usuário removido.', 'success');
          carregarUsuarios();
        } else {
          Swal.fire('Erro', 'Não foi possível excluir.', 'error');
        }
      } catch (e) {
        Swal.fire('Erro', 'Erro de conexão.', 'error');
      }
    }
  });
}

// Fechar modal ao clicar fora
window.onclick = function (event) {
  const modal = document.getElementById('modalUsuario');
  if (event.target == modal) {
    fecharModal();
  }
}