import type { NextApiRequest, NextApiResponse } from "next";
import { getDogsId } from "../../../lib/dogs";
import prisma from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { id },
    method,
  } = req; //All dog names from the API and DB are unique. In this case I'm using the name as the identifier instead of the id to improve SEO.

  try {
    switch (method) {
      case "GET":
        const dog = await getDogsId(id);
        res.json(dog);
        break;
      case "DELETE":
        if (Array.isArray(id)) return;
        await prisma.dog.delete({
          where: { name: id },
        });
        res.json(`Breed ${id} has been deleted sucessfully`);
      default:
        res.setHeader("Allow", ["GET", "DELETE"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (err) {
    console.error(err);
    res.status(404).send(err);
  }
}
