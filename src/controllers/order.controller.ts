import { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { customerPhone, productId, quantity , location , customer_name } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: "Produit non trouvé" });

    // Création de la commande avec son item lié
    const order = await prisma.order.create({
      data: {
        customerPhone,
        totalAmount: product.price * (quantity || 1),
        status: 'PENDING',
        location,
        customer_name,
        items: {
          create: {
            productId: product.id,
            quantity: quantity || 1,
            price: product.price
          }
        }
      },
      include: { items: true }
    });

    res.status(201).json({
      message: "Commande créée avec succès",
      orderId: order.id,
      total: order.totalAmount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de l'enregistrement de la commande."  });
  }
};

export const checkPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId as string) },
      select: { status: true, totalAmount: true }
    });

    if (!order) return res.status(404).json({ error: "Commande introuvable" });

    res.json({
      orderId,
      status: order.status,
      isPaid: order.status === 'PAID'
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la vérification." });
  }
};