import type { NextApiRequest, NextApiResponse } from "next";
import { DogtypeAll, getDogs } from "../../lib/dogs";
import prisma from "../../lib/prisma";
// type Data = {
//   name: string[];
// };

export default async function getTemperaments(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const dogs = await getDogs();
    const dogsTemperaments = dogs
      .flatMap((dog: DogtypeAll) => dog.temperament)
      .filter(Boolean);

    for (const temp of dogsTemperaments) {
      await prisma.temperament.upsert({
        where: { name: temp },
        update: {},
        create: { name: temp },
      });
    }

    const temperaments = await prisma.temperament.findMany();

    res.status(200).json(temperaments);
  } catch (err) {
    res.status(404);
  }
}
