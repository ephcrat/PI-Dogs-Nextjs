import type { NextApiRequest, NextApiResponse } from "next";
import { formatDogs, getDogs } from "../../../lib/dogs";
import prisma from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { name },
    method,
    body,
  } = req;

  try {
    switch (method) {
      case "GET":
        if (name && !Array.isArray(name)) {
          const dogsByName = await getDogs(name);
          const dogs = await formatDogs(dogsByName); //return only the necessary data for the main route
          return res.json(dogs);
        }
        const dogs = await getDogs();
        const dogsFormated = await formatDogs(dogs);
        res.json(dogsFormated);
        break;
      case "POST":
        if (
          !body.name ||
          !body.min_height ||
          !body.max_height ||
          !body.min_weight ||
          !body.max_weight ||
          !body.min_life_span ||
          !body.max_life_span ||
          !body.image ||
          !body.temperament
        )
          throw new Error("Missing required attributes");

        let dog = await prisma.dog.create({
          data: {
            name: body.name,
            min_height: body.min_height,
            max_height: body.max_height,
            min_weight: body.min_weight,
            max_weight: body.max_weight,
            min_life_span: body.min_life_span,
            max_life_span: body.max_life_span,
            image: body.image,
            temperament: {
              connect: body.temperament.map((t: string) => {
                return { name: t };
              }),
            },
          },
        });
        res.json(dog);
        break;
      default:
        res.setHeader("Allow", ["GET", "POST"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (err) {
    console.error(err);
    res.status(404).send(err);
  }
}
