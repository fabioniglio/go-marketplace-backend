import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateProductService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    // TODO
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer does not exist');
    }

    const productsId = products.map(product => {
      return { id: product.id };
    });

    const findAllProducts = await this.productsRepository.findAllById(
      productsId,
    );

    if (findAllProducts.length !== products.length) {
      throw new AppError('There is an invalid item on the request');
    }

    const finalProducts = findAllProducts.map(finalProduct => {
      const productFinal = products.find(
        productFind => productFind.id === finalProduct.id,
      );
      return {
        product_id: finalProduct.id,
        price: finalProduct.price,
        quantity: productFinal?.quantity || 0,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: finalProducts,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateProductService;
