import type { Stylist } from '../interfaces/stylist.interface';

export const STYLISTS: Stylist[] = [
  {
    id: 1,
    name: 'Alejandro Vargas',
    title: 'Master Barber & Fundador',
    bio: 'Con más de 15 años de experiencia en barbería clásica y contemporánea. Alejandro ha perfeccionado su técnica en academias de Londres y Madrid. Especialista en degradados y diseños personalizados.',
    specialties: ['Degradados', 'Corte Clásico', 'Barba Tradicional'],
    image: 'alejandro',
    rating: 4.9,
  },
  {
    id: 2,
    name: 'Carlos Mendoza',
    title: 'Barbero Senior & Colorista',
    bio: 'Carlos combina su pasión por la barbería con la coloración capilar avanzada. Certificado en técnicas de coloración europeas. Crea looks modernos con un enfoque artístico.',
    specialties: ['Coloración', 'Mechas', 'Corte Moderno'],
    image: 'carlos',
    rating: 4.8,
  },
  {
    id: 3,
    name: 'Diego Fernández',
    title: 'Especialista en Barba & Tratamientos',
    bio: 'Diego es un artesano de la barba. Su meticulosidad y conocimiento en tratamientos capilares lo convierten en el favorito para quienes buscan un cuidado completo e integral.',
    specialties: ['Barba Completa', 'Tratamientos', 'Corte Degradado'],
    image: 'diego',
    rating: 4.7,
  },
  {
    id: 4,
    name: 'Santiago Ruiz',
    title: 'Barbero de Caballeros',
    bio: 'Santiago se especializa en cortes clásicos de caballero y técnicas tradicionales con navetilla. Su atención al detalle y servicio personalizado crean una experiencia única.',
    specialties: ['Corte Clásico', 'Navetilla', 'Estilo Vintage'],
    image: 'santiago',
    rating: 4.9,
  },
];
