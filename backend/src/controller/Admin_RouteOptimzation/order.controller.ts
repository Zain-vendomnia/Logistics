import { Request, Response } from 'express';
import { LogisticOrder } from '../../model/LogisticOrders';



export const getAllLogisticOrders = async (_req: Request, res: Response) => {
    try {
      const orders = await LogisticOrder.getAll();

      res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
};

export const getcountcheck = async(_req: Request, res: Response) => {
  try {
    const orders = await LogisticOrder.getAllCount();
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
  
};

