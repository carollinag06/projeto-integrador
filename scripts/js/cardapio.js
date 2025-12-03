const API_URL = "http://localhost:3000/pratos";

window.onload = carregarCardapio;

async function carregarCardapio() {
    const response = await fetch(API_URL);
    const pratos = await response.json();

    // limpar containers
    document.getElementById("lista-entradas").innerHTML = "";
    document.getElementById("lista-massas").innerHTML = "";
    document.getElementById("lista-sobremesas").innerHTML = "";
    document.getElementById("lista-bebidas").innerHTML = "";

    pratos.forEach(p => {
        switch (p.tipo) {
            case "Entradas":
                adicionarPrato("lista-entradas", p);
                break;
            case "Massas":
                adicionarPrato("lista-massas", p);
                break;
            case "Sobremesas":
                adicionarPrato("lista-sobremesas", p);
                break;
            case "Bebidas":
                adicionarPrato("lista-bebidas", p);
                break;
            default:
                adicionarPrato("lista-entradas", p);
                break;
        }
    });
}

function adicionarPrato(containerId, prato) {
    const container = document.getElementById(containerId);

    const div = document.createElement("div");
    div.classList.add("prato");

    div.innerHTML = `
        <img src="${prato.imagem}" alt="${prato.nome}">
        <div>
            <h3>${prato.nome}</h3>
            <p>${prato.descricao}</p>
            <p>R$ ${prato.preco}</p>
        </div>
    `;

    container.appendChild(div);
}
