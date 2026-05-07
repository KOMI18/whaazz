import axios from 'axios';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL; 
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

export const EvolutionService = {
  // 1. Créer l'instance sur le serveur Evolution
createInstance: async (instanceName: string) => {
  const response = await axios.post(`${EVOLUTION_API_URL}/instance/create`, {
    instanceName: instanceName,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS",
    token: process.env.EVOLUTION_INSTANCE_TOKEN,
    webhook: {
      url: process.env.WEBHOOK_URL,
      byEvents: false,
      base64: true, 
      events: [
        "CONNECTION_UPDATE",
        "MESSAGES_UPSERT",
        "QRCODE_UPDATED"
      ]
    }
  }, {
    headers: { 'apikey': EVOLUTION_API_KEY }
  });
  return response.data;
},

  // 2. Récupérer le QR Code si l'instance existe déjà
  getQRCode: async (instanceName: string) => {
    const instanceToken = process.env.EVOLUTION_INSTANCE_TOKEN || "mon_secret_fixe";
    
    const response = await axios.get(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      headers: { 
        'apikey': EVOLUTION_API_KEY,
        
      }
    });
    return response.data; 
  },
  getConnectionStatus: async (instanceName: string) => {
    const response = await axios.get(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    return response.data; 
  },
  disconectInstance: async (instanceName: string) => {
    const response = await axios.delete(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    return response.data; 
  },
  deleteInstance: async (instanceName: string) => {
    const response = await axios.delete(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    return response.data; 
  }
};