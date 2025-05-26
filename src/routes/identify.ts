import express, { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router(); // ✅ CORRECT usage

const prisma = new PrismaClient();

router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({ error: 'Email or phoneNumber is required' });
  }

  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { email: email ?? undefined },
        { phoneNumber: phoneNumber ?? undefined }
      ]
    },
    orderBy: { createdAt: 'asc' }
  });

  let primaryContact;
  if (contacts.length === 0) {
    primaryContact = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: 'primary'
      }
    });
  } else {
    primaryContact = contacts.find(c => c.linkPrecedence === 'primary') || contacts[0];

    const alreadyExists = contacts.some(c =>
      c.email === email && c.phoneNumber === phoneNumber
    );

    if (!alreadyExists) {
      await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: 'secondary',
          linkedId: primaryContact.id
        }
      });
    }
  }

  const allContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: primaryContact.id },
        { linkedId: primaryContact.id }
      ]
    }
  });

  const emails = [...new Set(allContacts.map(c => c.email).filter(Boolean))];
  const phoneNumbers = [...new Set(allContacts.map(c => c.phoneNumber).filter(Boolean))];
  const secondaryContactIds = allContacts
    .filter(c => c.linkPrecedence === 'secondary')
    .map(c => c.id);

  return res.json({
    contact: {
      primaryContactId: primaryContact.id,
      emails,
      phoneNumbers,
      secondaryContactIds
    }
  });
});

export default router;
