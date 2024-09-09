from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///products.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(100), nullable=False)
    product_type = db.Column(db.String(50), nullable=False)
    date_bought = db.Column(db.Date, nullable=False)
    price_bought = db.Column(db.Float, nullable=False)
    date_sold = db.Column(db.Date, nullable=True)
    price_sold = db.Column(db.Float, nullable=True)
    condition = db.Column(db.String(20), nullable=False)
    image = db.Column(db.String(255), nullable=True)
    is_sold = db.Column(db.Boolean, default=False)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/products', methods=['POST'])
def add_product():
    product_name = request.form['product_name']
    product_type = request.form['product_type']
    date_bought = datetime.strptime(request.form['date_bought'], '%d/%m/%Y').date()
    price_bought = float(request.form['price_bought'])
    condition = request.form['condition']
    
    image_file = request.files['image']
    if image_file:
        filename = secure_filename(image_file.filename)
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image_file.save(image_path)
        image_url = f"/{image_path}"
    else:
        image_url = None

    new_product = Product(
        product_name=product_name,
        product_type=product_type,
        date_bought=date_bought,
        price_bought=price_bought,
        condition=condition,
        image=image_url,
        is_sold=False
    )

    db.session.add(new_product)
    db.session.commit()

    return jsonify({'message': 'Product added successfully!'}), 201

@app.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    product = Product.query.get_or_404(product_id)

    product.product_name = request.form['product_name']
    product.product_type = request.form['product_type']
    product.date_bought = datetime.strptime(request.form['date_bought'], '%d/%m/%Y').date()
    product.price_bought = float(request.form['price_bought'])
    product.condition = request.form['condition']

    if 'image' in request.files:
        image_file = request.files['image']
        if image_file:
            filename = secure_filename(image_file.filename)
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image_file.save(image_path)
            product.image = f"/{image_path}"

    product.is_sold = 'is_sold' in request.form and request.form['is_sold'] == 'on'
    if product.is_sold:
        product.date_sold = datetime.strptime(request.form['date_sold'], '%d/%m/%Y').date()
        product.price_sold = float(request.form['price_sold'])
    else:
        product.date_sold = None
        product.price_sold = None

    db.session.commit()

    return jsonify({'message': 'Product updated successfully!'}), 200

@app.route('/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    result = []

    for product in products:
        result.append({
            'id': product.id,
            'product_name': product.product_name,
            'product_type': product.product_type,
            'date_bought': product.date_bought.strftime('%d/%m/%Y'),
            'price_bought': product.price_bought,
            'date_sold': product.date_sold.strftime('%d/%m/%Y') if product.date_sold else None,
            'price_sold': product.price_sold,
            'condition': product.condition,
            'image': product.image,
            'is_sold': product.is_sold
        })

    return jsonify(result), 200

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(debug=True)