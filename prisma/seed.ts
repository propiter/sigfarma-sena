import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default configurations
  const configurations = [
    {
      clave: 'iva_porcentaje',
      valor: '19',
      descripcion: 'Porcentaje de IVA aplicado a productos',
      tipoDato: 'numero'
    },
    {
      clave: 'moneda',
      valor: 'COP',
      descripcion: 'Moneda del sistema',
      tipoDato: 'texto'
    },
    {
      clave: 'alerta_roja_dias',
      valor: '180',
      descripcion: 'Días para alerta roja de vencimiento',
      tipoDato: 'numero'
    },
    {
      clave: 'alerta_amarilla_dias',
      valor: '365',
      descripcion: 'Días para alerta amarilla de vencimiento',
      tipoDato: 'numero'
    },
    {
      clave: 'margen_ganancia_default',
      valor: '30',
      descripcion: 'Margen de ganancia por defecto (%)',
      tipoDato: 'numero'
    }
  ];

  for (const config of configurations) {
    await prisma.configuracion.upsert({
      where: { clave: config.clave },
      update: {},
      create: config
    });
  }

  // Create default users
  const users = [
    {
      nombre: 'Administrador Principal',
      correo: 'admin@farmacia.com',
      contrasena: 'admin123',
      rol: 'administrador' as const
    },
    {
      nombre: 'Cajero Principal',
      correo: 'cajero@farmacia.com',
      contrasena: 'cajero123',
      rol: 'cajero' as const
    },
    {
      nombre: 'Encargado de Inventario',
      correo: 'inventario@farmacia.com',
      contrasena: 'inventario123',
      rol: 'inventario' as const
    }
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.contrasena, 12);
    await prisma.usuario.upsert({
      where: { correo: user.correo },
      update: {},
      create: {
        nombre: user.nombre,
        correo: user.correo,
        contrasenaHash: hashedPassword,
        rol: user.rol
      }
    });
  }

  // Create default provider
  const proveedor = await prisma.proveedor.upsert({
    where: { nombre: 'Farmacéutica Nacional S.A.' },
    update: {},
    create: {
      nombre: 'Farmacéutica Nacional S.A.',
      nit: '900123456-1',
      contacto: 'Juan Pérez',
      telefono: '3001234567',
      correo: 'ventas@farmanacional.com',
      direccion: 'Calle 100 #45-67, Bogotá'
    }
  });

  // Create sample products
  const productos = [
    {
      codigoBarras: '7702132001234',
      nombre: 'Acetaminofén 500mg',
      principioActivo: 'Acetaminofén',
      concentracion: '500mg',
      formaFarmaceutica: 'Tableta',
      presentacion: 'Caja x 20 tabletas',
      laboratorio: 'Genfar',
      registroSanitario: 'INVIMA 2023M-0001234',
      precioVentaSugerido: 3500,
      stockMinimo: 50
    },
    {
      codigoBarras: '7702132001235',
      nombre: 'Ibuprofeno 400mg',
      principioActivo: 'Ibuprofeno',
      concentracion: '400mg',
      formaFarmaceutica: 'Tableta',
      presentacion: 'Caja x 20 tabletas',
      laboratorio: 'Lafrancol',
      registroSanitario: 'INVIMA 2023M-0001235',
      precioVentaSugerido: 4200,
      stockMinimo: 40
    },
    {
      codigoBarras: '7702132001236',
      nombre: 'Loratadina 10mg',
      principioActivo: 'Loratadina',
      concentracion: '10mg',
      formaFarmaceutica: 'Tableta',
      presentacion: 'Caja x 10 tabletas',
      laboratorio: 'MK',
      registroSanitario: 'INVIMA 2023M-0001236',
      precioVentaSugerido: 8500,
      stockMinimo: 30
    },
    {
      codigoBarras: '7702132001237',
      nombre: 'Omeprazol 20mg',
      principioActivo: 'Omeprazol',
      concentracion: '20mg',
      formaFarmaceutica: 'Cápsula',
      presentacion: 'Caja x 14 cápsulas',
      laboratorio: 'Tecnoquímicas',
      registroSanitario: 'INVIMA 2023M-0001237',
      precioVentaSugerido: 12000,
      stockMinimo: 25
    },
    {
      codigoBarras: '7702132001238',
      nombre: 'Amoxicilina 500mg',
      principioActivo: 'Amoxicilina',
      concentracion: '500mg',
      formaFarmaceutica: 'Cápsula',
      presentacion: 'Caja x 12 cápsulas',
      laboratorio: 'Chalver',
      registroSanitario: 'INVIMA 2023M-0001238',
      precioVentaSugerido: 15000,
      stockMinimo: 20,
      esControlado: true
    }
  ];

  for (const producto of productos) {
    const createdProduct = await prisma.producto.upsert({
      where: { codigoBarras: producto.codigoBarras },
      update: {},
      create: producto
    });

    // Create sample lots for each product
    const lotes = [
      {
        numeroLote: `L${producto.codigoBarras.slice(-4)}001`,
        fechaVencimiento: new Date('2025-12-31'),
        cantidadInicial: 100,
        cantidadDisponible: 85,
        precioCompra: producto.precioVentaSugerido * 0.7,
        precioVentaLote: producto.precioVentaSugerido
      },
      {
        numeroLote: `L${producto.codigoBarras.slice(-4)}002`,
        fechaVencimiento: new Date('2026-06-30'),
        cantidadInicial: 150,
        cantidadDisponible: 150,
        precioCompra: producto.precioVentaSugerido * 0.7,
        precioVentaLote: producto.precioVentaSugerido
      }
    ];

    let totalStock = 0;
    for (const lote of lotes) {
      await prisma.lote.create({
        data: {
          productoId: createdProduct.productoId,
          ...lote
        }
      });
      totalStock += lote.cantidadDisponible;
    }

    // Update product total stock
    await prisma.producto.update({
      where: { productoId: createdProduct.productoId },
      data: { stockTotal: totalStock }
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('👤 Default users created:');
  console.log('   - admin@farmacia.com / admin123 (Administrador)');
  console.log('   - cajero@farmacia.com / cajero123 (Cajero)');
  console.log('   - inventario@farmacia.com / inventario123 (Inventario)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });