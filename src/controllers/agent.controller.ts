import { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { customAlphabet } from 'nanoid';
import { EvolutionService } from '../services/evolution.service.js';


const nanoid = customAlphabet('1234567890abcdef', 6);

export const createAgent = async (req: Request, res: Response) => {
  try {
    const { name , businessName , domain , businessGoal  } = req.body;
    const userId = req.userId;
    const instanceName = `${name.toLowerCase().replace(/\s+/g, '-')}-${nanoid()}`;
    if (!userId) {
      return res.status(401).json({ 
        error: "Non autorisé : ID utilisateur manquant dans le token." 
      });
    }
    const agent = await prisma.agent.create({
      data: {
        name,
        instanceName,
        isActive: false,
        userId: userId,
        businessName ,
        domain,
        businessGoal
      }
    });

    await EvolutionService.createInstance(instanceName);

    res.status(201).json(agent);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erreur lors de la création de l'agent." });
  }
};


export const updateAgent = async (req: Request, res: Response) => {
  try {
    const  id  = req.params.id as string;
    const { name, systemPrompt, isActive } = req.body;

    const agent = await prisma.agent.update({
      where: { id },
      data: { name, systemPrompt, isActive }
    });

    res.status(200).json(agent);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la mise à jour." });
  }
};

export const getAgentQRCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agent = await prisma.agent.findUnique({ where: { id: id as string } });

    if (!agent) return res.status(404).json({ error: "Agent non trouvé" });

    // On demande à Evolution API le code de connexion
    const connectionData = await EvolutionService.getQRCode(agent.instanceName);

    res.json(connectionData);
  } catch (error) {
    res.status(500).json({ error: "Impossible de générer le QR Code." });
  }
};
export const getAgents = async (req: Request, res: Response) => {
  try {
    const agents = await prisma.agent.findMany({
      where: {
        userId: req.userId
      }
    });
    res.json(agents);
  } catch (error) {
  console.log(error);
  
    res.status(500).json({ error: "Erreur lors de la recherche des agents." });
  }
};
export const getAgentsId = async (req: Request, res: Response) => {
  try {
    const agents = await prisma.agent.findFirst({
      where: {
        userId: req.userId,
        AND : {
          id : req.params.id as string
        }
      }
    });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la recherche des agents." });
  }
};

export const LogouInstance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agent = await prisma.agent.findUnique({ where: { id: id as string } });

    if (!agent) return res.status(404).json({ error: "Agent non rencontré" });

    // On demande à Evolution API le code de connexion
    const connectionData = await EvolutionService.disconectInstance(agent.instanceName);
    await prisma.agent.update({
      where: { id: id as string },
      data: { isActive: false  , status: "DISCONNECTED" }
    });
    res.json(connectionData);
  } catch (error) {
    res.status(500).json({ error: "Impossible de générer le QR Code." });
  }
};
export const DeleteInstance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agent = await prisma.agent.findUnique({ where: { id: id as string } });

    if (!agent) return res.status(404).json({ error: "Agent non rencontré" });

    // On demande à Evolution API le code de connexion
    const connectionData = await EvolutionService.deleteInstance(agent.instanceName);
    await prisma.agent.delete({ where: { id: id as string } });
    
    res.json(connectionData);
  } catch (error) {

    console.log(error);
    res.status(500).json({ error: "Impossible de générer le QR Code." });
  }
};