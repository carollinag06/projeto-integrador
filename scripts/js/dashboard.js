document.addEventListener("DOMContentLoaded", () => {
    carregarDashboard();
});

/* ================================
      FUNÇÃO PRINCIPAL
================================ */
async function carregarDashboard() {
    const ano = document.getElementById("anoSelect").value;

    carregarTotais();
    carregarGraficoUsuarios(ano);
    carregarGraficoReservas(ano);
}

/* ================================
      CARDS DO TOPO
================================ */
async function carregarTotais() {
    try {
        // Total de clientes
        const usuarios = await fetch("http://127.0.0.1:3000/dashboard/totalUsuarios")
            .then(r => r.json());
        document.getElementById("totalUsuarios").innerText = usuarios.total;

        // Total de reservas — ROTA CORRIGIDA
        const reservas = await fetch("http://127.0.0.1:3000/dashboard/totalReservas")
            .then(r => r.json());
        document.getElementById("totalAgendamentos").innerText = reservas.total;

        // Último cliente cadastrado
        const ultimo = await fetch("http://127.0.0.1:3000/dashboard/ultimoCliente")
            .then(r => r.json());
        document.getElementById("lucroTotal").innerText = ultimo.nome || "Nenhum";

    } catch (erro) {
        console.error("Erro ao carregar totais:", erro);
    }
}

/* ================================
      GRÁFICO — USUÁRIOS POR MÊS
================================ */
let graficoUsuariosInstance = null;

async function carregarGraficoUsuarios(ano) {

    const resposta = await fetch(`http://127.0.0.1:3000/dashboard/usuariosPorMes/${ano}`);
    const dados = await resposta.json();

    const valores = Array(12).fill(0);
    dados.forEach(item => valores[item.mes - 1] = item.total);

    const ctx = document.getElementById("graficoUsuarios");

    if (graficoUsuariosInstance) graficoUsuariosInstance.destroy();

    graficoUsuariosInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
            datasets: [{
                label: "Usuários cadastrados por mês",
                data: valores,
                backgroundColor: "#2E8B57"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

/* ================================
      GRÁFICO — RESERVAS POR MÊS
================================ */
let graficoAgendamentosInstance = null;

async function carregarGraficoReservas(ano) {

    // ROTA CORRIGIDA
    const resposta = await fetch(`http://127.0.0.1:3000/dashboard/reservasPorMes/${ano}`);
    const dados = await resposta.json();

    const valores = Array(12).fill(0);
    dados.forEach(item => valores[item.mes - 1] = item.total);

    const ctx = document.getElementById("graficoAgendamentos");

    if (graficoAgendamentosInstance) graficoAgendamentosInstance.destroy();

    graficoAgendamentosInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
            datasets: [{
                label: "Reservas por mês",
                data: valores,
                borderColor: "#B22222",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}