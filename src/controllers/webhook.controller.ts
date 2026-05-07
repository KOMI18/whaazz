import prisma from "../config/prisma.js";
import {Response, Request} from "express";

export const handleEvolutionWebhook = async (req: Request, res: Response) => {
  try {
    const { event, data, instance } = req.body;
    const io = req.app.get('io');
    switch (event) {
      case "connection.update":
        console.log(`Instance ${instance} status: ${data.status}`);
        await prisma.agent.update({
          where: { instanceName: instance },
          data: { 
            status: data.status === "open" ? "CONNECTED" : "DISCONNECTED",
            isActive: data.status === "open"
          }
        });
        io.to(instance).emit('status_update', { 
            instance, 
            status: data.status === "open" ? "CONNECTED" : "DISCONNECTED",
            isActive: data.status === "open"
        });
        break;{{ $('Webhook').item.json.body.data.messageType }}

      case "messages.upsert":
        const workflowData = await prisma.agent.findFirst({
          where: {
            instanceName: instance
          },
          include:{
            user: true
          }
        });
       
        return res.status(200).json(workflowData);
        break;
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ error: "Internal Error" });
  }
};