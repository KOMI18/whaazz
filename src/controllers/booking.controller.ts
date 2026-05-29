import { Request , Response } from 'express';
import prisma from '../config/prisma.js';

export const searchBookingCatalog = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.query; // Récupéré depuis l'identifiant de l'agent IA

    if (!agentId) {
      return res.status(400).json({ error: "L'identifiant de l'agent est requis." });
    }

    const catalog = await prisma.bookableResource.findMany({
      where: { agentId: String(agentId) },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        bookingType: true,
        duration: true,
        maxCapacity: true,
      }
    });

    return res.json(catalog);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération du catalogue." });
  }
};