const API_URL = "http://localhost:3000/reservas";
let todasReservas = [];

window.onload = carregarReservas;

// 1. CARREGAR DADOS DO BACKEND
async function carregarReservas() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Erro ao buscar reservas");
    todasReservas = await res.json();

    // Ordenar por data (mais recente primeiro)
    todasReservas.sort((a, b) => new Date(b.data_reserva) - new Date(a.data_reserva));

    renderizarTabela(todasReservas);
  } catch (error) {
    console.error(error);
    Swal.fire("Erro", "Não foi possível carregar as reservas.", "error");
  }
}

// 2. RENDERIZAR TABELA
function renderizarTabela(lista) {
  const tbody = document.getElementById('tabela-reservas');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px;">Nenhuma reserva encontrada.</td></tr>`;
    return;
  }

  lista.forEach(r => {
    // Formatar Data (YYYY-MM-DD -> DD/MM/YYYY)
    const dataFormatada = r.data_reserva.split('-').reverse().join('/');

    // Nome do Cliente (Tratamento se usuário foi deletado)
    const nomeCliente = r.Usuario ? r.Usuario.nome : '<span style="color:red">Cliente Removido</span>';

    // Classe do Status
    let classeStatus = 'status-pendente';
    const st = r.status ? r.status.toLowerCase() : 'pendente';
    if (st.includes('confirmada')) classeStatus = 'status-confirmada';
    if (st.includes('cancelada')) classeStatus = 'status-cancelada';
    if (st.includes('concluida')) classeStatus = 'status-concluida';

    const rString = encodeURIComponent(JSON.stringify(r));

    tbody.innerHTML += `
                    <tr>
                        <td>#${r.id}</td>
                        <td>${dataFormatada}</td>
                        <td>${r.horario}</td>
                        <td><b>${nomeCliente}</b></td>
                        <td style="text-align:center">${r.numero_pessoas}</td>
                        <td><span class="status-badge ${classeStatus}">${r.status || 'Pendente'}</span></td>
                        <td><small>${r.observacoes || '-'}</small></td>
                        <td class="actions">
                            <button class="btn-icon edit" onclick="abrirEdicao('${rString}')" title="Editar">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="btn-icon del" onclick="cancelarReserva(${r.id})" title="Excluir/Cancelar">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </td>
                    </tr>
                `;
  });
}

// 3. FILTROS (DATA E NOME)
function aplicarFiltros() {
  const termo = document.getElementById('inputBusca').value.toLowerCase();
  const dataFiltro = document.getElementById('filtroData').value;

  const filtrados = todasReservas.filter(r => {
    // Filtro de Nome
    const nome = r.Usuario ? r.Usuario.nome.toLowerCase() : '';
    const matchNome = nome.includes(termo);

    // Filtro de Data
    let matchData = true;
    if (dataFiltro) {
      matchData = r.data_reserva === dataFiltro;
    }

    return matchNome && matchData;
  });

  renderizarTabela(filtrados);
}

function limparFiltros() {
  document.getElementById('inputBusca').value = '';
  document.getElementById('filtroData').value = '';
  renderizarTabela(todasReservas);
}

// 4. EDIÇÃO (MODAL)
function abrirEdicao(rEncoded) {
  const r = JSON.parse(decodeURIComponent(rEncoded));

  document.getElementById('reservaId').value = r.id;
  document.getElementById('nomeCliente').value = r.Usuario ? r.Usuario.nome : 'Cliente Desconhecido';
  document.getElementById('dataReserva').value = r.data_reserva;
  document.getElementById('horario').value = r.horario;
  document.getElementById('numPessoas').value = r.numero_pessoas;
  document.getElementById('observacoes').value = r.observacoes || '';
  document.getElementById('statusReserva').value = r.status || 'Pendente';

  document.getElementById('modalReserva').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('modalReserva').style.display = 'none';
}

async function salvarAlteracoes() {
  const id = document.getElementById('reservaId').value;
  const dados = {
    data_reserva: document.getElementById('dataReserva').value,
    horario: document.getElementById('horario').value,
    numero_pessoas: document.getElementById('numPessoas').value,
    status: document.getElementById('statusReserva').value,
    observacoes: document.getElementById('observacoes').value
  };

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    if (res.ok) {
      fecharModal();
      Swal.fire("Sucesso", "Reserva atualizada!", "success");
      carregarReservas();
    } else {
      throw new Error();
    }
  } catch (e) {
    Swal.fire("Erro", "Falha ao atualizar reserva.", "error");
  }
}

// 5. CANCELAR / DELETAR
function cancelarReserva(id) {
  Swal.fire({
    title: 'O que deseja fazer?',
    text: "Você pode cancelar a reserva (mudar status) ou excluir o registro permanentemente.",
    icon: 'question',
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: 'Mudar Status p/ Cancelada',
    denyButtonText: 'Excluir Registro',
    cancelButtonText: 'Sair'
  }).then(async (result) => {

    if (result.isConfirmed) {
      // OPÇÃO 1: Apenas mudar status para cancelada
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelada' })
      });
      carregarReservas();
      Swal.fire('Cancelada!', 'O status foi alterado.', 'success');

    } else if (result.isDenied) {
      // OPÇÃO 2: Deletar do banco
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      carregarReservas();
      Swal.fire('Excluído!', 'Registro removido do banco.', 'success');
    }
  });
}

// Fechar modal clicando fora
window.onclick = function (e) {
  if (e.target == document.getElementById('modalReserva')) fecharModal();
}