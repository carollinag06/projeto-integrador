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

            // Renderiza o prato
            div.innerHTML = `
                        <img src="${p.imagem}" alt="${p.nome}">
                        <h3>${p.nome}</h3>
                        <p>R$ ${p.preco}</p>
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