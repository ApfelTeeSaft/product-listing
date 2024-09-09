document.addEventListener('DOMContentLoaded', () => {
    const productList = document.getElementById('product-list');
    const pagination = document.getElementById('pagination');
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close-btn');
    const addProductBtn = document.getElementById('add-product-btn');
    const productForm = document.getElementById('product-form');
    const modalTitle = document.getElementById('modal-title');
    const isSoldCheckbox = document.getElementById('is_sold');
    const soldFields = document.getElementById('sold-fields');
    const searchTypeSelect = document.getElementById('search-type');
    const searchQueryInput = document.getElementById('search-query');
    const searchTypeQueryDropdown = document.getElementById('search-type-query');
    const searchButton = document.getElementById('search-button');
    let currentPage = 1;
    const itemsPerPage = 10;
    let editMode = false;
    let editProductId = null;

    function fetchProducts() {
        fetch('/products')
            .then(response => response.json())
            .then(data => renderProducts(data))
            .catch(error => console.error('Error fetching products:', error));
    }

    function searchProducts() {
        const searchType = searchTypeSelect.value;
        let searchQuery;

        if (searchType === 'type') {
            searchQuery = searchTypeQueryDropdown.value;
        } else {
            searchQuery = searchQueryInput.value;
        }

        if (searchQuery.trim() === '') {
            fetchProducts();
            return;
        }

        fetch(`/search?type=${searchType}&query=${encodeURIComponent(searchQuery)}`)
            .then(response => response.json())
            .then(data => renderProducts(data))
            .catch(error => console.error('Error searching products:', error));
    }

    function renderProducts(products) {
        productList.innerHTML = '';
        pagination.innerHTML = '';

        const totalPages = Math.ceil(products.length / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const currentItems = products.slice(start, end);

        currentItems.forEach(product => {
            const productItem = document.createElement('div');
            productItem.classList.add('product-item');
            productItem.innerHTML = `
                <img src="${product.image}" alt="${product.product_name}">
                <h3>${product.product_name}</h3>
                <p>Type: ${product.product_type}</p>
                <p>Date Bought: ${product.date_bought}</p>
                <p>Price Bought: $${product.price_bought}</p>
                <p>Condition: ${product.condition}</p>
                <p>Sold: ${product.is_sold ? 'Yes' : 'No'}</p>
                ${product.is_sold ? `<p>Date Sold: ${product.date_sold}</p><p>Price Sold: $${product.price_sold}</p>` : ''}
                <button class="edit-button" data-id="${product.id}">Edit</button>
                <button class="delete-button" data-id="${product.id}">Delete</button>
            `;
            productList.appendChild(productItem);
        });

        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            if (i === currentPage) button.disabled = true;
            button.addEventListener('click', () => {
                currentPage = i;
                renderProducts(products);
            });
            pagination.appendChild(button);
        }

        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', () => {
                editMode = true;
                editProductId = button.getAttribute('data-id');
                openModalForEdit(editProductId);
            });
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', () => {
                const productId = button.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
                    deleteProduct(productId);
                }
            });
        });
    }

    addProductBtn.addEventListener('click', () => {
        editMode = false;
        editProductId = null;
        modalTitle.textContent = 'Add New Product';
        productForm.reset();
        soldFields.style.display = 'none';
        modal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    isSoldCheckbox.addEventListener('change', () => {
        soldFields.style.display = isSoldCheckbox.checked ? 'block' : 'none';
    });

    productForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(productForm);
        const url = editMode ? `/products/${editProductId}` : '/products';
        const method = editMode ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                fetchProducts();
                modal.style.display = 'none';
                productForm.reset();
            })
            .catch(error => console.error('Error adding/updating product:', error));
    });

    function openModalForEdit(productId) {
        fetch(`/products`)
            .then(response => response.json())
            .then(products => {
                const product = products.find(p => p.id == productId);
                if (product) {
                    modalTitle.textContent = 'Edit Product';
                    document.getElementById('product_name').value = product.product_name;
                    document.getElementById('product_type').value = product.product_type;
                    document.getElementById('date_bought').value = product.date_bought;
                    document.getElementById('price_bought').value = product.price_bought;
                    document.getElementById('condition').value = product.condition;
                    isSoldCheckbox.checked = product.is_sold;
                    if (product.is_sold) {
                        document.getElementById('date_sold').value = product.date_sold ? product.date_sold : '';
                        document.getElementById('price_sold').value = product.price_sold ? product.price_sold : '';
                        soldFields.style.display = 'block';
                    } else {
                        soldFields.style.display = 'none';
                    }
                    modal.style.display = 'flex';
                }
            })
            .catch(error => console.error('Error fetching product details:', error));
    }

    function deleteProduct(productId) {
        fetch(`/products/${productId}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                fetchProducts();
            })
            .catch(error => console.error('Error deleting product:', error));
    }

    searchTypeSelect.addEventListener('change', () => {
        if (searchTypeSelect.value === 'type') {
            searchQueryInput.style.display = 'none';
            searchTypeQueryDropdown.style.display = 'block';
        } else {
            searchQueryInput.style.display = 'block';
            searchTypeQueryDropdown.style.display = 'none';
        }
    });

    fetchProducts();

    searchButton.addEventListener('click', searchProducts);
});