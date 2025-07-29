document.addEventListener('DOMContentLoaded', () => {
    // Declaração de elementos do DOM
    const newListInput = document.getElementById('newListInput');
    const addListButton = document.getElementById('addListButton');
    const listsContainer = document.getElementById('listsContainer');
    const currentListView = document.getElementById('currentListView');
    const currentListName = document.getElementById('currentListName');
    const newItemInput = document.getElementById('newItemInput');
    const addItemButton = document.getElementById('addItemButton');
    const itemsList = document.getElementById('itemsList');
    const filterAllButton = document.getElementById('filterAll');
    const filterActiveButton = document.getElementById('filterActive');
    const filterCompletedButton = document.getElementById('filterCompleted');
    const backToListsButton = document.getElementById('backToListsButton');
    const clearCompletedButton = document.getElementById('clearCompletedButton'); // NOVA VARIÁVEL

    // Variáveis de estado
    let lists = JSON.parse(localStorage.getItem('shoppingLists')) || {};
    let currentListId = null; // ID da lista atualmente selecionada
    let currentFilter = 'all'; // 'all', 'active', 'completed'

    // --- Funções Auxiliares ---

    // Função para salvar as listas no LocalStorage
    function saveLists() {
        localStorage.setItem('shoppingLists', JSON.stringify(lists));
    }

    // Função para deletar uma lista
    function deleteList(listId) {
        if (confirm(`Tem certeza que deseja excluir a lista "${lists[listId].name}"?`)) {
            delete lists[listId];
            saveLists();
            renderLists();
            // Se a lista excluída for a atualmente selecionada, volte para a visualização de listas
            if (currentListId === listId) {
                currentListId = null;
                currentListView.style.display = 'none';
                listsContainer.style.display = 'block';
            }
        }
    }

    // Função para marcar/desmarcar um item como concluído
    function toggleItemCompletion(itemId) {
        const item = lists[currentListId].items.find(i => i.id === itemId);
        if (item) {
            item.completed = !item.completed;
            saveLists();
            renderItems();
        }
    }

    // Função para deletar um item
    function deleteItem(itemId) {
        lists[currentListId].items = lists[currentListId].items.filter(item => item.id !== itemId);
        saveLists();
        renderItems();
    }

    // Função para atualizar o estado dos botões de filtro
    function updateFilterButtons() {
        filterAllButton.classList.remove('active');
        filterActiveButton.classList.remove('active');
        filterCompletedButton.classList.remove('active');

        if (currentFilter === 'all') {
            filterAllButton.classList.add('active');
        } else if (currentFilter === 'active') {
            filterActiveButton.classList.add('active');
        } else if (currentFilter === 'completed') {
            filterCompletedButton.classList.add('active');
        }
    }

    // Função para editar o nome da lista
    function editListName(listId, spanElement) {
        const currentName = lists[listId].name;
        const inputEdit = document.createElement('input');
        inputEdit.type = 'text';
        inputEdit.value = currentName;
        inputEdit.classList.add('edit-input');
        inputEdit.maxLength = 50;

        spanElement.replaceWith(inputEdit);
        inputEdit.focus();

        const saveEdit = () => {
            const newName = inputEdit.value.trim();
            if (newName && newName !== currentName) {
                lists[listId].name = newName;
                saveLists();
                if (currentListId === listId) {
                    currentListName.textContent = newName;
                }
            }
            // Retorna o span com o nome atualizado ou original se vazio
            spanElement.textContent = lists[listId].name;
            inputEdit.replaceWith(spanElement);
            // Re-renderiza as listas para garantir que os listeners de clique e dblclick estejam no lugar certo para o SPAN recriado
            renderLists(); // Re-renderiza TODAS as listas. Ou poderia focar em apenas re-anexar os listeners ao span
        };

        inputEdit.addEventListener('blur', saveEdit);
        inputEdit.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            }
        });
    }

    // Função para editar o texto do item
    function editItemText(itemId, labelElement) {
        const item = lists[currentListId].items.find(i => i.id === itemId);
        if (!item) return;

        const currentText = item.text;
        const inputEdit = document.createElement('input');
        inputEdit.type = 'text';
        inputEdit.value = currentText;
        inputEdit.classList.add('edit-input');
        inputEdit.maxLength = 100;

        labelElement.replaceWith(inputEdit);
        inputEdit.focus();

        const saveEdit = () => {
            const newText = inputEdit.value.trim();
            if (newText && newText !== currentText) {
                item.text = newText;
                saveLists();
            }
            // Re-renderiza para garantir que a classe 'completed' e outros listeners estejam corretos
            renderItems();
        };

        inputEdit.addEventListener('blur', saveEdit);
        inputEdit.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            }
        });
    }

    // --- Funções de Renderização e Lógica Principal ---

    // Função para renderizar as listas de nomes
    function renderLists() {
        listsContainer.innerHTML = '';
        if (Object.keys(lists).length === 0) {
            listsContainer.innerHTML = '<p style="text-align: center; color: #666;">Nenhuma lista criada ainda. Crie uma!</p>';
            return;
        }
        for (const listId in lists) {
            const listCard = document.createElement('div');
            listCard.classList.add('list-card');
            listCard.dataset.id = listId;

            const listNameSpan = document.createElement('span');
            listNameSpan.textContent = lists[listId].name;
            listNameSpan.classList.add('list-name-display');

            listNameSpan.addEventListener('click', () => {
                selectList(listId);
            });

            listNameSpan.addEventListener('dblclick', () => {
                editListName(listId, listNameSpan);
            });

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-list-button');
            deleteButton.textContent = 'X';
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                deleteList(listId);
            });

            listCard.appendChild(listNameSpan);
            listCard.appendChild(deleteButton);
            listsContainer.appendChild(listCard);
        }
    }

    // Função para renderizar os itens da lista selecionada
    function renderItems() {
        itemsList.innerHTML = ''; // Limpa o conteúdo existente
        const currentItems = lists[currentListId].items;

        const filteredItems = currentItems.filter(item => {
            if (currentFilter === 'active') {
                return !item.completed;
            } else if (currentFilter === 'completed') {
                return item.completed;
            }
            return true; // 'all'
        });

        // Adicionado um pequeno ajuste aqui para o parágrafo "Nenhum item..."
        if (filteredItems.length === 0) {
            const noItemsMessage = document.createElement('p');
            noItemsMessage.style.textAlign = 'center';
            noItemsMessage.style.color = '#666';
            if (currentFilter === 'all') {
                noItemsMessage.textContent = 'Nenhum item nesta lista. Adicione um!';
            } else if (currentFilter === 'active') {
                noItemsMessage.textContent = 'Nenhum item ativo nesta lista.';
            } else { // completed
                noItemsMessage.textContent = 'Nenhum item concluído nesta lista.';
            }
            itemsList.appendChild(noItemsMessage);
        } else {
            filteredItems.forEach((item) => {
                const listItem = document.createElement('li');
                listItem.classList.toggle('completed', item.completed);

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = item.completed;
                checkbox.addEventListener('change', () => {
                    toggleItemCompletion(item.id);
                });

                const label = document.createElement('label');
                label.textContent = item.text;
                label.addEventListener('click', () => {
                    checkbox.checked = !checkbox.checked;
                    toggleItemCompletion(item.id);
                });

                label.addEventListener('dblclick', () => {
                    editItemText(item.id, label);
                });

                const deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-item-button');
                deleteButton.textContent = 'X';
                deleteButton.addEventListener('click', () => {
                    deleteItem(item.id);
                });

                listItem.appendChild(checkbox);
                listItem.appendChild(label);
                listItem.appendChild(deleteButton);
                itemsList.appendChild(listItem);
            });
        }

        // Gerencia a visibilidade do botão Limpar Concluídos
        const hasCompletedItems = currentItems.some(item => item.completed);
        if (hasCompletedItems) {
            clearCompletedButton.style.display = 'block';
        } else {
            clearCompletedButton.style.display = 'none';
        }
    }


    // Função para selecionar uma lista e exibir seus itens
    function selectList(listId) {
        currentListId = listId;
        currentListName.textContent = lists[listId].name;
        listsContainer.style.display = 'none';
        currentListView.style.display = 'block';
        currentFilter = 'all'; // Reseta o filtro ao selecionar uma nova lista
        updateFilterButtons();
        renderItems();
    }


    // --- Listeners de Eventos ---

    // Listener para adicionar nova lista
    addListButton.addEventListener('click', () => {
        const listName = newListInput.value.trim();
        if (listName) {
            const newId = Date.now().toString();
            lists[newId] = {
                name: listName,
                items: []
            };
            newListInput.value = '';
            saveLists();
            renderLists();
        } else {
            alert('Por favor, digite um nome para a nova lista.');
            newListInput.focus();
        }
    });

    // Listener para adicionar novo item
    addItemButton.addEventListener('click', () => {
        const itemText = newItemInput.value.trim();
        if (itemText && currentListId) {
            lists[currentListId].items.push({
                id: Date.now().toString(),
                text: itemText,
                completed: false
            });
            newItemInput.value = '';
            saveLists();
            renderItems();
        } else if (!itemText) {
            alert('Por favor, digite o nome do item.');
            newItemInput.focus();
        }
    });

    // Listeners para os botões de filtro
    filterAllButton.addEventListener('click', () => {
        currentFilter = 'all';
        updateFilterButtons();
        renderItems();
    });

    filterActiveButton.addEventListener('click', () => {
        currentFilter = 'active';
        updateFilterButtons();
        renderItems();
    });

    filterCompletedButton.addEventListener('click', () => {
        currentFilter = 'completed';
        updateFilterButtons();
        renderItems();
    });

    // Listener para o botão Limpar Concluídos
    clearCompletedButton.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja remover todos os itens concluídos desta lista?')) {
            lists[currentListId].items = lists[currentListId].items.filter(item => !item.completed);
            saveLists();
            renderItems();
        }
    });

    // Listener para o botão Voltar para Listas
    backToListsButton.addEventListener('click', () => {
        currentListId = null;
        currentListView.style.display = 'none';
        listsContainer.style.display = 'block';
        renderLists();
    });

    // Inicializa a aplicação ao carregar a página
    renderLists();
});