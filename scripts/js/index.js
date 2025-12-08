// Chama a função para carregar as promoções ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  carregarPromocoes();
});

const API_URL = "http://localhost:3000/pratos";

async function carregarPromocoes() {
  const container = document.getElementById("promocoes-container");

  // Limpa o container antes de adicionar novos itens
  container.innerHTML = '';

  try {
    const response = await fetch(API_URL);
    const pratos = await response.json();

    // Filtra TODOS os pratos onde 'promocao' é true (boolean)
    const promocoes = pratos.filter(p => p.promocao === true);

    // Verifica se há promoções e renderiza
    if (promocoes.length > 0) {
      promocoes.forEach(p => {
        const div = document.createElement("div");
        div.classList.add("menu");

        // Cursor de mãozinha para indicar clique
        div.style.cursor = "pointer";

        // Evento de clique que leva para o cardápio com o ID do prato
        div.onclick = function () {
          // Garante que o ID está sendo passado corretamente
          window.location.href = `cardapio.html?destaque=${p.idPratos}`;
        };

        // Formata o preço para o padrão brasileiro (R$ 00,00)
        const precoFormatado = parseFloat(p.preco).toFixed(2).replace('.', ',');

        div.innerHTML = `
                    <div class="img-container">
                         <img src="${p.imagem}" alt="${p.nome}">
                    </div>
                    <h3>${p.nome}</h3>
                    <p>R$ ${precoFormatado}</p>
                `;

        container.appendChild(div);
      });
    } else {
      // Mensagem se não houver promoções
      container.innerHTML = '<p style="text-align: center; width: 100%; padding: 20px;">Nenhuma promoção disponível no momento. Volte em breve!</p>';
    }

  } catch (error) {
    console.error("Erro ao carregar promoções:", error);
    container.innerHTML = '<p style="text-align: center; width: 100%; padding: 20px; color: red;">Não foi possível carregar as promoções. Tente novamente mais tarde.</p>';
  }
}