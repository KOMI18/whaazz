import { Request , Response } from 'express';
import prisma from '../config/prisma.js';
import { BookingStatus, BookingType } from '../types/booking.js';
import { addDays, startOfDay, endOfDay, format, getDay } from 'date-fns';
//Ce contrôleur permet à l'IA de lister tout ce qui est disponible à la réservation pour l'agent en cours.
export const searchBookingCatalog = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.query;
    
    // 1. Récupérer toutes les règles d'indisponibilités et disponibilités
    const resources = await prisma.bookableResource.findMany({
      where: { agentId: String(agentId) },
      include: { availabilities: true }
    });

    const startRange = new Date(); // Aujourd'hui
    const endRange = addDays(startRange, 7); // Les 7 prochains jours

    const finalPlanning = resources.map(resource => {
      let realSlots: Array<{ date: string; time: string; capacity: number }> = [];

      // Séparer les règles pour aller plus vite
      const recurrents = resource.availabilities.filter(a => a.dayOfWeek !== null && !a.isUnavailableBlock);
      const uniques = resource.availabilities.filter(a => a.specificDate !== null && !a.isUnavailableBlock);
      const blocks = resource.availabilities.filter(a => a.isUnavailableBlock);

      // Boucler sur les 7 prochains jours pour générer le planning réel
      for (let i = 0; i < 7; i++) {
        const currentDay = addDays(startRange, i);
        // Prisma / JS: 0=Dimanche, 1=Lundi... Attention à matcher ton mapping (1=Lundi dans ton comm)
        const currentDayNum = getDay(currentDay); 

        // A. On check les récurrents pour ce jour précis de la semaine
        recurrents.forEach(rule => {
          if (rule.dayOfWeek === currentDayNum) {
            realSlots.push({
              date: format(currentDay, 'yyyy-MM-dd'),
              time: rule.startTime!,
              capacity: rule.maxCapacity
            });
          }
        });
      }

      // B. On ajoute les sessions uniques (specificDate) qui sont dans notre semaine
      uniques.forEach(rule => {
        const slotDate = new Date(rule.specificDate!);
        if (slotDate >= startRange && slotDate <= endRange) {
          realSlots.push({
            date: format(slotDate, 'yyyy-MM-dd'),
            time: rule.startTime || format(slotDate, 'HH:mm'),
            capacity: rule.maxCapacity
          });
        }
      });

      // C. CRUCIAL : On filtre et supprime les créneaux qui sont bloqués/annulés cette semaine
      realSlots = realSlots.filter(slot => {
        const slotFullDateTime = new Date(`${slot.date}T${slot.time}:00`);
        
        // Si le créneau tombe dans une période d'indisponibilité, on le jette
        const isBlocked = blocks.some(block => {
          return slotFullDateTime >= new Date(block.blockStartDate!) && 
                 slotFullDateTime <= new Date(block.blockEndDate!);
        });

        return !isBlocked; // On garde si c'est pas bloqué
      });

      return {
        resourceId: resource.id,
        name: resource.title,
        price: resource.price,
        slots: realSlots 
      };
    });

    return res.json(finalPlanning);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur génération planning." });
  }
};

export const checkAvailability = async (req: Request, res: Response) => {
  try {
    const { resourceId, start_date, end_date } = req.body;

    const resource = await prisma.bookableResource.findUnique({
      where: { id: resourceId },
      include: { availabilities: true, bookings: true }
    });

    if (!resource) {
      return res.status(404).json({ error: "Ressource introuvable." });
    }

    const requestedStart = new Date(start_date);

    // =========================================================================
    // CAS A : TIME_SLOT (Rendez-vous individuel à l'heure)
    // =========================================================================
    if (resource.bookingType === BookingType.TIME_SLOT.toString()) {
      const dayOfWeek = requestedStart.getDay(); // 0 = Dimanche, 1 = Lundi...
      const requestedTimeStr = requestedStart.toTimeString().substring(0, 5); // "14:30"

      // 1. Vérifier si l'établissement est ouvert ce jour-là à cette heure
      const isOpen = resource.availabilities.some(av => 
        av.dayOfWeek === dayOfWeek && 
        av.startTime && av.endTime &&
        requestedTimeStr >= av.startTime && requestedTimeStr < av.endTime
      );

      if (!isOpen) {
        return res.json({ available: false, message: "L'établissement est fermé ou indisponible à cette heure." });
      }

      // 2. Vérifier s'il n'y a pas déjà un rendez-vous à la même heure
      const hasConflict = resource.bookings.some(b => 
        b.status !== BookingStatus.CANCELLE.toString() && 
        b.startDate.getTime() === requestedStart.getTime()
      );

      if (hasConflict) {
        return res.json({ available: false, message: "Ce créneau horaire est déjà réservé." });
      }

      return res.json({ available: true, message: "Créneau disponible." });
    }

    // =========================================================================
    // CAS B : CAPACITY (Coaching, Événement de groupe)
    // =========================================================================
    if (resource.bookingType === BookingType.CAPACITY.toString()) {
      // Compter le nombre de tickets confirmés ou en attente pour cet événement
      const activeBookingsCount = resource.bookings.filter(b => 
        b.status !== BookingStatus.CANCELLE.toString() && 
        b.startDate.getTime() === requestedStart.getTime()
      ).length;

      const remainingSeats = resource.maxCapacity - activeBookingsCount;

      if (remainingSeats <= 0) {
        return res.json({ available: false, message: "Désolé, cette session est complète." });
      }

      return res.json({ 
        available: true, 
        message: `Places disponibles. Il reste ${remainingSeats} places.`,
        remainingSeats 
      });
    }

    // =========================================================================
    // CAS C : DATE_RANGE (Hébergement, Location de véhicules)
    // =========================================================================
    if (resource.bookingType === BookingType.DATE_RANGE.toString()) {
      if (!end_date) {
        return res.status(400).json({ error: "Une date de fin (end_date) est requise pour ce type de réservation." });
      }
      const requestedEnd = new Date(end_date);

      // Vérifier s'il y a un chevauchement de dates avec une réservation existante
      const hasOverlap = resource.bookings.some(b => 
        b.status !== BookingStatus.CANCELLE.toString() && 
        (requestedStart < (b.endDate || b.startDate) && requestedEnd > b.startDate)
      );

      if (hasOverlap) {
        return res.json({ available: false, message: "La ressource n'est pas disponible pour ces dates." });
      }

      return res.json({ available: true, message: "Dates disponibles." });
    }
    // =========================================================================
    // CAS D : CAPACITY_RECURRENT (Cours collectifs réguliers : Pilates, Yoga...)
    // =========================================================================
    if (resource.bookingType === BookingType.CAPACITY_RECURRENT.toString()) {
      // 1. Formater la date demandée pour extraire uniquement la date (YYYY-MM-DD) et l'heure (HH:mm)
      const requestedDateStr = requestedStart.toISOString().substring(0, 10); // "2026-06-02"
      const requestedTimeStr = requestedStart.toTimeString().substring(0, 5); // "10:00"

      console.log("Recherche Session - Date: ", requestedDateStr, " Heure: ", requestedTimeStr);

      // 2. Trouver la session spécifique en base de données
      const slotConfig = resource.availabilities.find(av => {
        if (!av.specificDate) return false;
        
        const avDateStr = new Date(av.specificDate).toISOString().substring(0, 10);
        return avDateStr === requestedDateStr && av.startTime === requestedTimeStr;
      });

      // Si aucune session n'est programmée par le gérant pour ce jour et cette heure précis
      if (!slotConfig) {
        return res.json({ 
          available: false, 
          message: "Il n'y a aucune session programmée pour ce jour et cette heure." 
        });
      }

      // 3. Compter le nombre de réservations actives pour ce créneau exact
      const activeBookingsCount = resource.bookings.filter(b => 
        b.status !== BookingStatus.CANCELLE.toString() && 
        b.startDate.getTime() === requestedStart.getTime()
      ).length;

      // 4. Calculer les places restantes selon la capacité injectée sur ce créneau spécifique
      const remainingSeats = slotConfig.maxCapacity - activeBookingsCount;

      if (remainingSeats <= 0) {
        return res.json({ 
          available: false, 
          message: "Désolé, cette séance est complète." 
        });
      }

      return res.json({ 
        available: true, 
        message: `Il reste ${remainingSeats} places disponibles pour cette séance.`,
        remainingSeats 
      });
    }
    return res.status(400).json({ error: "Type de réservation inconnu." });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la vérification des disponibilités." });
  }
};
export const confirmBooking = async (req: Request, res: Response) => {
  try {
    const { resourceId, start_date, end_date, customer_name, customer_phone } = req.body;

    if (!resourceId || !start_date || !customer_name || !customer_phone) {
      return res.status(400).json({ error: "Champs obligatoires manquants." });
    }

    // TODO: re-vérifier la disponibilité ici avant d'insérer

    const newBooking = await prisma.booking.create({
      data: {
        bookableResourceId: resourceId,
        customerName: customer_name,
        customerPhone: customer_phone,
        startDate: new Date(start_date),
        endDate: end_date ? new Date(end_date) : null,
        status: "PENDING" // Devient en attente de validation/paiement par le propriétaire
      }
    });

    return res.json({
      success: true,
      message: "Réservation enregistrée avec succès !",
      booking: newBooking
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible de finaliser la réservation." });
  }
};
export const createBookableResource = async (req: Request, res: Response) => {
  try {
    const { 
      agentId, 
      title, 
      description, 
      price, 
      bookingType, 
      duration, 
      maxCapacity, 
      availabilities 
    } = req.body;

    // 1. Validations de base
    if (!agentId || !title || !bookingType) {
      return res.status(400).json({ error: "Les champs agentId, title et bookingType sont obligatoires." });
    }

    // Ajout de "CAPACITY_RECURRENT" dans la liste des types autorisés
    const validTypes = ["TIME_SLOT", "CAPACITY", "CAPACITY_RECURRENT", "DATE_RANGE"];
    if (!validTypes.includes(bookingType)) {
      return res.status(400).json({ error: "Type de réservation invalide." });
    }

    // 2. Nettoyage et cohérence des données selon le type
    let finalDuration = null;
    let finalMaxCapacity = 1;

    // Pour les rendez-vous solos et le Pilates, la durée du cours/RDV est requise
    if (bookingType === "TIME_SLOT" || bookingType === "CAPACITY_RECURRENT") {
      if (!duration) return res.status(400).json({ error: `La durée est requise pour le type ${bookingType}.` });
      finalDuration = Number(duration);
    }

    // Pour un événement unique (Conférence, Masterclass sur une seule date)
    if (bookingType === "CAPACITY") {
      if (!maxCapacity) return res.status(400).json({ error: "La capacité maximale globale est requise pour le type CAPACITY." });
      finalMaxCapacity = Number(maxCapacity);
    }

    // 3. Création de la ressource et mapping dynamique des disponibilités
    const newResource = await prisma.bookableResource.create({
      data: {
        agentId,
        title,
        description,
        price: price,
        bookingType,
        duration: finalDuration,
        maxCapacity: finalMaxCapacity, // Reste à 1 par défaut pour TIME_SLOT/DATE_RANGE
        
        availabilities: availabilities && Array.isArray(availabilities) ? {
          create: availabilities.map((av: any) => {
            // Logique spécifique pour CAPACITY_RECURRENT (ex: Pilates)
            // Si le frontend envoie une capacité par créneau, on la prend, sinon on met 1 par défaut
            let slotCapacity = 1;
            if (bookingType === "CAPACITY_RECURRENT") {
              slotCapacity = av.maxCapacity ? Number(av.maxCapacity) : 10; // 10 par défaut si non spécifié
            }

            return {
              dayOfWeek: av.dayOfWeek !== undefined ? Number(av.dayOfWeek) : null,
              startTime: av.startTime || null,
              endTime: av.endTime || null,
              maxCapacity: slotCapacity, // On injecte la capacité au niveau du créneau !
              specificDate: av.specificDate ? new Date(av.specificDate) : null,
              isUnavailableBlock: av.isUnavailableBlock || false,
              blockStartDate: av.blockStartDate ? new Date(av.blockStartDate) : null,
              blockEndDate: av.blockEndDate ? new Date(av.blockEndDate) : null,
            };
          })
        } : undefined
      },
      include: {
        availabilities: true 
      }
    });

    // Correction du status code (201 pour la création)
    return res.status(201).json({
      success: true,
      message: "Le service réservable a été créé avec succès.",
      resource: newResource
    });

  } catch (error) {
    console.error("Erreur createBookableResource:", error);
    return res.status(500).json({ error: "Erreur interne lors de la création du service." });
  }
};