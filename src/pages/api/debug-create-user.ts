import type { NextApiRequest, NextApiResponse } from 'next';
import { createUserForLeader } from '@/services/userSync';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await createUserForLeader(
      '18b0e473-0791-419c-9e17-a034e02a2fb2',
      'fcf1e3dc-3908-4b1f-b2c4-65abea9a8d91',
      '90e649c3-13ea-4fdc-a1c8-f352ef794b20'
    );
    res.status(200).json({ 
      result,
      error: result.error ? result.error.message : null
    });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
