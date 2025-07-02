import { Response } from 'express';
import { prisma } from '../../core/prisma/client.js';
import { AuthRequest } from '../../core/middleware/auth.js';

export class UnitsController {
  getUnits = async (_req: AuthRequest, res: Response) => {
    try {
      const units = await prisma.unidadMedida.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' }
      });

      res.json(units);
    } catch (error) {
      console.error('Error getting units:', error);
      res.status(500).json({ message: 'Error al obtener unidades de medida' });
    }
  };

  createUnit = async (req: AuthRequest, res: Response) => {
    try {
      const { nombre, abreviacion } = req.body;

      if (!nombre || !abreviacion) {
        return res.status(400).json({ message: 'Nombre y abreviación son requeridos' });
      }

      const unit = await prisma.unidadMedida.create({
        data: { nombre, abreviacion }
      });

      res.status(201).json(unit);
    } catch (error) {
      console.error('Error creating unit:', error);
      res.status(500).json({ message: 'Error al crear unidad de medida' });
    }
  };
}