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
            clave: 'alerta_naranja_dias',
            valor: '730',
            descripcion: 'Días para alerta naranja de vencimiento (2 años)',
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
    // Create units of measure
    const unidades = [
        { nombre: 'Tabletas', abreviacion: 'tab' },
        { nombre: 'Cápsulas', abreviacion: 'cap' },
        { nombre: 'Mililitros', abreviacion: 'ml' },
        { nombre: 'Gramos', abreviacion: 'gr' },
        { nombre: 'Cajas', abreviacion: 'caj' },
        { nombre: 'Frascos', abreviacion: 'fco' },
        { nombre: 'Ampollas', abreviacion: 'amp' },
        { nombre: 'Sobres', abreviacion: 'sob' }
    ];
    for (const unidad of unidades) {
        await prisma.unidadMedida.upsert({
            where: { nombre: unidad.nombre },
            update: {},
            create: unidad
        });
    }
    // Create default users
    const users = [
        {
            nombre: 'Administrador Principal',
            correo: 'admin@farmacia.com',
            contrasena: 'admin123',
            rol: 'administrador'
        },
        {
            nombre: 'Cajero Principal',
            correo: 'cajero@farmacia.com',
            contrasena: 'cajero123',
            rol: 'cajero'
        },
        {
            nombre: 'Encargado de Inventario',
            correo: 'inventario@farmacia.com',
            contrasena: 'inventario123',
            rol: 'inventario'
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
    // Get unit IDs
    const unidadTabletas = await prisma.unidadMedida.findUnique({ where: { nombre: 'Tabletas' } });
    const unidadCapsula = await prisma.unidadMedida.findUnique({ where: { nombre: 'Cápsulas' } });
    const unidadMl = await prisma.unidadMedida.findUnique({ where: { nombre: 'Mililitros' } });
    // Create sample products
    const productos = [
        {
            codigoBarras: '7702132001234',
            nombre: 'Acetaminofén 500mg',
            principioActivo: 'Acetaminofén',
            concentracion: '500mg',
            formaFarmaceutica: 'Tableta',
            presentacion: 'Caja x 20 tabletas',
            unidadMedidaId: unidadTabletas.unidadId,
            laboratorio: 'Genfar',
            registroSanitario: 'INVIMA 2023M-0001234',
            precioVentaSugerido: 3500,
            stockMinimo: 50,
            stockMaximo: 500
        },
        {
            codigoBarras: '7702132001235',
            nombre: 'Ibuprofeno 400mg',
            principioActivo: 'Ibuprofeno',
            concentracion: '400mg',
            formaFarmaceutica: 'Tableta',
            presentacion: 'Caja x 20 tabletas',
            unidadMedidaId: unidadTabletas.unidadId,
            laboratorio: 'Lafrancol',
            registroSanitario: 'INVIMA 2023M-0001235',
            precioVentaSugerido: 4200,
            stockMinimo: 40,
            stockMaximo: 400
        },
        {
            codigoBarras: '7702132001236',
            nombre: 'Loratadina 10mg',
            principioActivo: 'Loratadina',
            concentracion: '10mg',
            formaFarmaceutica: 'Tableta',
            presentacion: 'Caja x 10 tabletas',
            unidadMedidaId: unidadTabletas.unidadId,
            laboratorio: 'MK',
            registroSanitario: 'INVIMA 2023M-0001236',
            precioVentaSugerido: 8500,
            stockMinimo: 30,
            stockMaximo: 300
        },
        {
            codigoBarras: '7702132001237',
            nombre: 'Omeprazol 20mg',
            principioActivo: 'Omeprazol',
            concentracion: '20mg',
            formaFarmaceutica: 'Cápsula',
            presentacion: 'Caja x 14 cápsulas',
            unidadMedidaId: unidadCapsula.unidadId,
            laboratorio: 'Tecnoquímicas',
            registroSanitario: 'INVIMA 2023M-0001237',
            precioVentaSugerido: 12000,
            stockMinimo: 25,
            stockMaximo: 250
        },
        {
            codigoBarras: '7702132001238',
            nombre: 'Amoxicilina 500mg',
            principioActivo: 'Amoxicilina',
            concentracion: '500mg',
            formaFarmaceutica: 'Cápsula',
            presentacion: 'Caja x 12 cápsulas',
            unidadMedidaId: unidadCapsula.unidadId,
            laboratorio: 'Chalver',
            registroSanitario: 'INVIMA 2023M-0001238',
            precioVentaSugerido: 15000,
            stockMinimo: 20,
            stockMaximo: 200,
            esControlado: true
        },
        {
            codigoBarras: '7702132001239',
            nombre: 'Jarabe para la Tos 120ml',
            principioActivo: 'Dextrometorfano',
            concentracion: '15mg/5ml',
            formaFarmaceutica: 'Jarabe',
            presentacion: 'Frasco x 120ml',
            unidadMedidaId: unidadMl.unidadId,
            laboratorio: 'Bayer',
            registroSanitario: 'INVIMA 2023M-0001239',
            precioVentaSugerido: 18000,
            stockMinimo: 15,
            stockMaximo: 150,
            requiereRefrigeracion: true
        }
    ];
    for (const producto of productos) {
        const createdProduct = await prisma.producto.upsert({
            where: { codigoBarras: producto.codigoBarras },
            update: {},
            create: producto
        });
        // Create sample lots for each product with different expiration alerts
        const lotes = [
            {
                numeroLote: `L${producto.codigoBarras.slice(-4)}001`,
                fechaVencimiento: new Date('2025-12-31'), // Verde
                cantidadInicial: 100,
                cantidadDisponible: 85,
                precioCompra: producto.precioVentaSugerido * 0.7,
                precioVentaLote: producto.precioVentaSugerido,
                alertaVencimiento: 'Verde'
            },
            {
                numeroLote: `L${producto.codigoBarras.slice(-4)}002`,
                fechaVencimiento: new Date('2025-06-30'), // Amarillo
                cantidadInicial: 150,
                cantidadDisponible: 150,
                precioCompra: producto.precioVentaSugerido * 0.7,
                precioVentaLote: producto.precioVentaSugerido,
                alertaVencimiento: 'Amarillo'
            },
            {
                numeroLote: `L${producto.codigoBarras.slice(-4)}003`,
                fechaVencimiento: new Date('2025-03-15'), // Rojo
                cantidadInicial: 50,
                cantidadDisponible: 30,
                precioCompra: producto.precioVentaSugerido * 0.7,
                precioVentaLote: producto.precioVentaSugerido,
                alertaVencimiento: 'Rojo',
                notas: 'Lote próximo a vencer - priorizar venta'
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
        // Create restock notifications for low stock products
        if (totalStock <= producto.stockMinimo) {
            await prisma.notificacionReabastecimiento.create({
                data: {
                    productoId: createdProduct.productoId,
                    tipoNotificacion: 'StockBajo',
                    mensaje: `El producto ${producto.nombre} tiene stock bajo (${totalStock}/${producto.stockMinimo})`,
                    prioridad: 'Alta'
                }
            });
        }
    }
    console.log('✅ Database seeded successfully!');
    console.log('👤 Default users created:');
    console.log('   - admin@farmacia.com / admin123 (Administrador)');
    console.log('   - cajero@farmacia.com / cajero123 (Cajero)');
    console.log('   - inventario@farmacia.com / inventario123 (Inventario)');
    console.log('📦 Sample products and lots created with different expiration alerts');
    console.log('🔔 Restock notifications created for low stock products');
}
main()
    .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
