  const API_URL = 'http://127.0.0.1:3000';
    let usuarioAtualID = null;

    // ==========================================
    // 1. CARREGAR DADOS DA TELA
    // ==========================================
    async function carregarDados() {
      const usuarioString = localStorage.getItem('usuarioLogado');
      if (!usuarioString) {
        window.location.href = 'login.html';
        return;
      }

      const usuarioObjeto = JSON.parse(usuarioString);
      usuarioAtualID = usuarioObjeto.id;

      try {
        const response = await fetch(`${API_URL}/usuarios/${usuarioAtualID}`);
        if (response.ok) {
          const dados = await response.json();

          // --- LÓGICA DO ADMIN (NOVO) ---
          // Se tipoUsuario for 2 (Admin), mostra o painel
          if (dados.tipoUsuario == 2 || dados.tipoUsuario === 'admin') {
            document.getElementById('area-admin').style.display = 'block';
          }

          // Preenche os textos na tela
          document.getElementById('displayNome').innerText = dados.nome;
          document.getElementById('displayEmail').innerText = dados.email;
          document.getElementById('displayTelefone').innerText = dados.telefone || '-';
          document.getElementById('displayPratos').innerText = dados.pratos_preferidos || '-';

          // Preenche os campos do Modal de Perfil
          document.getElementById('editNome').value = dados.nome;
          document.getElementById('editEmail').value = dados.email;
          document.getElementById('editTelefone').value = dados.telefone || '';
          document.getElementById('editPratos').value = dados.pratos_preferidos || '';

          // Mostra a tela
          document.getElementById('loading').style.display = 'none';
          document.getElementById('conteudo-perfil').style.display = 'block';

          // Chama a função de buscar reservas
          carregarReservas();
        }
      } catch (erro) {
        console.error(erro);
        alert('Erro ao conectar no servidor.');
      }
    }

    // ==========================================
    // 2. GERENCIAR RESERVAS (LISTAR, EDITAR, EXCLUIR)
    // ==========================================
    async function carregarReservas() {
      const divLista = document.getElementById('lista-reservas');
      divLista.innerHTML = '<p class="text-center text-muted"><small>Atualizando...</small></p>';

      try {
        const res = await fetch(`${API_URL}/reservas/usuario/${usuarioAtualID}`);

        if (!res.ok) {
          console.error('Resposta /reservas/usuario não-ok', res.status);
          divLista.innerHTML = `<p class="text-danger text-center">Erro ao buscar reservas (status ${res.status}).</p>`;
          return;
        }

        const reservas = await res.json();

        divLista.innerHTML = ''; // Limpa

        if (!Array.isArray(reservas) || reservas.length === 0) {
          divLista.innerHTML = `
            <div class="text-center py-3 text-muted">
              <i class="bi bi-calendar-x fs-1"></i>
              <p>Nenhuma reserva encontrada.</p>
            </div>`;
          return;
        }

        reservas.forEach(reserva => {
          // Formata data
          const dataFormatada = reserva.data_reserva.split('-').reverse().join('/');

          const html = `
          <div class="reserva-item">
            <div class="reserva-info">
              <span class="reserva-data">📅 ${dataFormatada} - ${reserva.horario}</span>
              <span class="reserva-detalhes">Mesa para ${reserva.numero_pessoas} pessoas</span>
              <span class="reserva-status">Confirmada</span>
            </div>
            <div class="d-flex">
              <button class="btn btn-action text-primary" title="Editar"
                onclick="abrirModalReserva('${reserva.id}', '${reserva.data_reserva}', '${reserva.horario}', '${reserva.numero_pessoas}')">
                <i class="bi bi-pencil-fill"></i>
              </button>
              <button class="btn btn-action text-danger" title="Cancelar"
                onclick="cancelarReserva('${reserva.id}')">
                <i class="bi bi-trash-fill"></i>
              </button>
            </div>
          </div>`;
          divLista.innerHTML += html;
        });

      } catch (error) {
        console.error('Erro ao buscar reservas:', error);
        divLista.innerHTML = '<p class="text-danger text-center">Erro ao buscar reservas. Verifique o servidor.</p>';
      }
    }

    // A. Abrir Modal Reserva
    function abrirModalReserva(id, data, hora, pessoas) {
      document.getElementById('editReservaId').value = id;
      document.getElementById('editReservaData').value = data;
      document.getElementById('editReservaHorario').value = hora;
      document.getElementById('editReservaPessoas').value = pessoas;

      new bootstrap.Modal(document.getElementById('modalEditarReserva')).show();
    }

    // B. Salvar Reserva (PUT)
    async function salvarMudancasReserva() {
      const id = document.getElementById('editReservaId').value;
      const dados = {
        data_reserva: document.getElementById('editReservaData').value,
        horario: document.getElementById('editReservaHorario').value,
        numero_pessoas: document.getElementById('editReservaPessoas').value
      };

      try {
        await fetch(`${API_URL}/reservas/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dados)
        });

        bootstrap.Modal.getInstance(document.getElementById('modalEditarReserva')).hide();
        Swal.fire({ title: 'Reserva Atualizada!', icon: 'success', timer: 1500, showConfirmButton: false });
        carregarReservas();

      } catch (error) { Swal.fire('Erro', 'Falha ao atualizar.', 'error'); }
    }

    // C. Cancelar Reserva (DELETE)
    function cancelarReserva(id) {
      Swal.fire({
        title: 'Cancelar Reserva?',
        text: "Tem certeza que deseja desmarcar?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sim, cancelar'
      }).then(async (result) => {
        if (result.isConfirmed) {
          await fetch(`${API_URL}/reservas/${id}`, { method: 'DELETE' });
          Swal.fire({ title: 'Cancelado!', icon: 'success', timer: 1500, showConfirmButton: false });
          carregarReservas();
        }
      });
    }

    // ==========================================
    // 3. GERENCIAR PERFIL (EDITAR DADOS)
    // ==========================================
    function abrirModalEditarPerfil() {
      new bootstrap.Modal(document.getElementById('modalEditarPerfil')).show();
    }

    async function salvarMudancasPerfil() {
      const dados = {
        nome: document.getElementById('editNome').value,
        email: document.getElementById('editEmail').value,
        telefone: document.getElementById('editTelefone').value,
        pratos_preferidos: document.getElementById('editPratos').value
      };

      try {
        await fetch(`${API_URL}/usuarios/${usuarioAtualID}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dados)
        });

        // Atualiza nome no localStorage
        const userLocal = JSON.parse(localStorage.getItem('usuarioLogado'));
        userLocal.nome = dados.nome;
        localStorage.setItem('usuarioLogado', JSON.stringify(userLocal));

        bootstrap.Modal.getInstance(document.getElementById('modalEditarPerfil')).hide();
        Swal.fire({ title: 'Perfil Salvo!', icon: 'success', timer: 1500, showConfirmButton: false });
        carregarDados();

      } catch (e) { alert('Erro ao salvar perfil'); }
    }

    // ==========================================
    // 4. LOGOUT
    // ==========================================
    function logout() {
      Swal.fire({
        title: 'Sair da conta?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sair'
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem('usuarioLogado');
          window.location.href = "index.html";
        }
      });
    }

    // Inicializa a página
    carregarDados();
