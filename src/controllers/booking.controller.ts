import { Request , Response } from 'express';
import prisma from '../config/prisma.js';
import { BookingStatus, BookingType } from '../types/booking.js';

//Ce contrôleur permet à l'IA de lister tout ce qui est disponible à la réservation pour l'agent en cours.
export const searchBookingCatalog = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.query;

    if (!agentId) {
      return res.status(400).json({ error: "L'identifiant de l'agent est requis." });
    }

    const catalog = await prisma.bookableResource.findMany({
      where: { agentId: String(agentId)},
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