import { Request, Response } from 'express';
import prisma from '../config/prisma.js'; 
import { StorageService } from '../services/storage.service.js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, price, stock, category } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "L'image du vêtement est requise." });
    }

    // 1. Upload vers Cloudflare R2
    const imageUrl = await StorageService.uploadFile(file, 'products');

    // 2. Génération de la description visuelle (Vision AI)
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Tu es un expert en mode et stylisme pour SHIEN ATTITUDE. Ton rôle est de décrire très précisément ce vêtement pour qu'un moteur de recherche puisse le retrouver dans une base de données.

# INSTRUCTIONS :
1. ANALYSE : Identifie le type de vêtement (Robe, Ensemble, Pantalon Cargo, Top, Corset, etc.).
2. DÉTAILS TECHNIQUES : Précise la couleur exacte, la matière (si visible), les motifs (fleurs, uni, léopard), et la coupe (oversize, cintré, fendu, taille haute).
3. ÉLÉMENTS DISTINCTIFS : Note la présence de poches, de boutons, de fermetures éclair, de strass ou de dentelle.
4. TEXTE : Ignore le texte publicitaire TikTok, mais si un prix ou une marque est écrit à la main sur l'image, note-le.

# FORMAT DE RÉPONSE ATTENDU (Court et dense) :
[Catégorie] - [Couleur] - [Style/Coupe] - [Détails]

Exemple : "Ensemble de sport - Bleu ciel - Cintré - Matière élastique avec logo blanc sur la poitrine."

Si l'image ne représente absolument pas un vêtement ou un accessoire de mode, commence ta réponse par le mot 'HORS_SUJET'. C'est important pour qu'une recherche textuelle puisse le retrouver.` },
            { type: "image_url", image_url: { url: imageUrl } }
          ],
        },
      ],
    });

    const visualDescription = aiResponse.choices[0].message.content;

    // 3. Enregistrement Prisma
    const product = await prisma.product.create({
      data: {
        name,
        price: parseInt(price),
        stock: parseInt(stock),
        category,
        imageUrl,
        visualDescription
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la création du produit." });
  }
};

export const getAllProducts = async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json(products);
};
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const queryStr = String(q);

    // 1. On nettoie la chaîne (on enlève les tirets et on découpe par espace)
    const keywords = queryStr
      .replace(/-/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2); // On ignore les petits mots comme "le", "de"

    const products = await prisma.product.findMany({
      where: {
        OR: keywords.map(word => ({
            OR: [
                { name: { contains: word, mode: 'insensitive' } },
                { visualDescription: { contains: word, mode: 'insensitive' } }
            ]
            }))
    },
    take: 5
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Erreur recherche" });
  }
};