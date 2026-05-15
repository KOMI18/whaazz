import { Request, Response } from 'express';
import prisma from '../config/prisma.js'; 
import { StorageService } from '../services/storage.service.js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, price, stock, category , description } = req.body;
    const file = req.file;

    if (req.userId === undefined) {
      return res.status(401).json({ error: "Non autorisé : ID utilisateur manquant dans le token." });
    }
    if (!file) {
      return res.status(400).json({ error: "L'image du produit est requise." });
    }

    // 1. Upload vers le stockage Cloud (Cloudflare R2, S3, etc.)
    const imageUrl = await StorageService.uploadFile(file, 'products');

    // 2. Génération de la description visuelle générique multi-secteurs (Vision AI)
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Tu es un expert en analyse visuelle et indexation de données. Ton rôle est de décrire très précisément l'objet ou le sujet principal de cette image de manière totalement neutre, sans te limiter à un secteur spécifique (mode, tech, alimentation, maison, etc.).

# INSTRUCTIONS :
1. SUJET PRINCIPAL : Identifie immédiatement l'objet central ou la scène de l'image.
2. ATTRIBUTS VISUELS : Précise la couleur prédominante, les formes géométriques, les matériaux apparents (métal, plastique, verre, tissu) et l'aspect général (moderne, vintage, neuf, usé).
3. MARQUES & TEXTES : Si une marque, un texte important ou un logo est distinctement visible sur l'objet ou l'emballage, mentionne-le textuellement.
4. NEUTRALE : Ignore l'arrière-plan s'il n'apporte rien à la compréhension de l'objet principal.

# FORMAT DE RÉPONSE ATTENDU (Court, factuel et dense) :
[Sujet Principal/Catégorie] - [Couleurs & Matériaux] - [Caractéristiques/Détails Distinctifs]

Exemples de résultats attendus :
- "Téléphone portable - Noir et aluminium - Écran tactile fissuré avec logo Apple visible au dos."
- "Chaise de bureau - Bleu turquoise et plastique blanc - Modèle ergonomique à roulettes avec accoudoirs réglables."
- "Bouteille de jus de fruits - Transparent et étiquette verte - Contenu orange avec inscription '100% Pur Jus' rédigée à la main."

Si l'image est floue, vide, ou s'il est impossible d'identifier un objet concret, commence obligatoirement ta réponse par le mot exact 'HORS_SUJET'.` 
            },
            { 
              type: "image_url", 
              image_url: { url: imageUrl } 
            }
          ],
        },
      ],
    });

    const visualDescription = aiResponse.choices[0].message.content + " - " + description;

    // 3. Enregistrement dans votre base de données via Prisma
    const product = await prisma.product.create({
      data: {
        name,
        price: parseInt(price),
        stock: parseInt(stock),
        category,
        imageUrl,
        visualDescription: visualDescription || "Aucune description disponible.",
        userId: req.userId
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la création du produit." });
  }
};


export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const totalProducts = products.length;
    
    const stockValue = products.reduce((acc, product) => {
      return acc + (product.price * product.stock);
    }, 0);

    res.json({
      products,
      stats: {
        totalProducts,
        stockValue
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération du catalogue." });
  }
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