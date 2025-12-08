        const API_URL = "http://localhost:3000/pratos";
        let editId = null;

        // 1. CARREGAR PRATOS AO INICIAR
        window.onload = carregarPratos;

        async function carregarPratos() {
            try {
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error('Falha ao buscar');
                const pratos = await response.json();

                // AQUI O JS PROCURA O ID "lista-pratos". AGORA ELE EXISTE NO HTML ACIMA.
                const lista = document.getElementById("lista-pratos"); 
                lista.innerHTML = "";

                if (pratos.length === 0) {
                    lista.innerHTML = "<p style='text-align:center; color:#777; margin-top:20px;'>Nenhum prato cadastrado.</p>";
                    return;
                }

                pratos.forEach(p => {
                    const promoBadge = p.promocao ? `<span class="badge-promo">PROMOÇÃO</span>` : '';
                    
                    // Tratamento seguro para passar o objeto no onclick
                    const pratoString = encodeURIComponent(JSON.stringify(p));

                    lista.innerHTML += `
                        <div class="prato-card">
                            <img src="${p.imagem}" class="prato-img" alt="${p.nome}" onerror="this.src='https://placehold.co/100?text=Sem+Foto'">
                            
                            <div class="prato-info">
                                <h3>
                                    ${p.nome} 
                                    <span class="badge-cat">${p.tipo}</span>
                                    ${promoBadge}
                                </h3>
                                <p class="desc">${p.descricao}</p>
                                <p class="price">R$ ${parseFloat(p.preco).toFixed(2).replace('.', ',')}</p>
                            </div>

                            <div class="acoes">
                                <button class="btn-icon btn-edit" title="Editar" onclick="prepararEdicao('${pratoString}')">
                                    <i class="bi bi-pencil-fill"></i>
                                </button>
                                <button class="btn-icon btn-del" title="Excluir" onclick="confirmarExclusao(${p.idPratos})">
                                    <i class="bi bi-trash-fill"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
            } catch (error) {
                console.error(error);
                // Evita que o erro pare o script se a div não existir (mas agora existe)
                const lista = document.getElementById("lista-pratos");
                if(lista) lista.innerHTML = "<p style='color:red; text-align:center'>Erro ao conectar com o servidor.</p>";
            }
        }

        // 2. SALVAR (CRIAR OU EDITAR)
        async function salvarPrato() {
            const nome = document.getElementById("nome").value;
            const preco = document.getElementById("preco").value;
            const descricao = document.getElementById("descricao").value;
            const modo_preparo = document.getElementById("modo_preparo").value;
            const tipo = document.getElementById("tipo").value;
            const promocao = document.getElementById("promocao").checked;
            const imagem = document.getElementById("imagem").files[0];

            if (!nome || !preco || !descricao || !tipo) {
                Swal.fire("Atenção", "Preencha os campos obrigatórios (Nome, Preço, Descrição, Tipo)", "warning");
                return;
            }

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
                url = `${API_URL}/${editId}`;
                method = "PUT";
            }

            try {
                const response = await fetch(url, { method, body: formData });
                if (response.ok) {
                    Swal.fire("Sucesso!", editId ? "Prato atualizado." : "Prato criado.", "success");
                    limparCampos();
                    carregarPratos();
                } else {
                    throw new Error("Erro no servidor");
                }
            } catch (error) {
                Swal.fire("Erro", "Falha ao salvar o prato.", "error");
            }
        }

        // 3. PREPARAR EDIÇÃO
        function prepararEdicao(pratoEncoded) {
            const p = JSON.parse(decodeURIComponent(pratoEncoded));
            
            editId = p.idPratos; // Certifique-se que no banco é idPratos
            document.getElementById("nome").value = p.nome;
            document.getElementById("preco").value = p.preco;
            document.getElementById("descricao").value = p.descricao;
            document.getElementById("modo_preparo").value = p.modo_preparo;
            document.getElementById("tipo").value = p.tipo;
            document.getElementById("promocao").checked = p.promocao;

            // Mostrar preview da imagem atual
            const imgPreview = document.getElementById('img-preview');
            if (p.imagem) {
                imgPreview.src = p.imagem;
                imgPreview.style.display = 'block';
            }

            // Mudar visual do botão
            document.getElementById("tituloForm").innerText = "Editando Prato";
            const btn = document.getElementById("btnSalvar");
            btn.innerHTML = `<i class="bi bi-arrow-repeat"></i> Atualizar Prato`;
            btn.style.background = "#d35400"; // Laranja para indicar edição

            // Rolar para o topo (útil no mobile)
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // 4. CONFIRMAR EXCLUSÃO
        function confirmarExclusao(id) {
            Swal.fire({
                title: 'Tem certeza?',
                text: "Você não poderá reverter isso!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sim, excluir!',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
                        if (res.ok) {
                            Swal.fire('Excluído!', 'O prato foi removido.', 'success');
                            carregarPratos();
                        } else {
                            throw new Error();
                        }
                    } catch (e) {
                        Swal.fire('Erro', 'Não foi possível excluir.', 'error');
                    }
                }
            });
        }

        // 5. LIMPAR CAMPOS
        function limparCampos() {
            editId = null;
            document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(i => i.value = '');
            document.getElementById('imagem').value = '';
            document.getElementById('tipo').selectedIndex = 0;
            document.getElementById('promocao').checked = false;
            document.getElementById('img-preview').style.display = 'none';
            
            // Resetar Botão e Título
            document.getElementById("tituloForm").innerText = "Novo Prato";
            const btn = document.getElementById("btnSalvar");
            btn.innerHTML = `<i class="bi bi-check-lg"></i> Adicionar Prato`;
            btn.style.background = ""; // Volta a cor original (CSS)
        }

        // 6. PREVIEW IMAGEM E FILTRO (Visuais)
        function previewImage(input) {
            const preview = document.getElementById('img-preview');
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                }
                reader.readAsDataURL(input.files[0]);
            }
        }

        function filtrarPratos() {
            const termo = document.getElementById('inputBusca').value.toLowerCase();
            const cards = document.querySelectorAll('.prato-card');
            cards.forEach(card => {
                const nome = card.querySelector('h3').innerText.toLowerCase();
                card.style.display = nome.includes(termo) ? "flex" : "none";
            });
        }