import prisma from "./prisma";
import axios from "axios";
const BASE_URL = "https://api.thedogapi.com/v1/breeds";

// type Dogtype = {
//   id?: string;
//   name?: string;
//   image?: string;
//   temperament?: object[];
//   weight?: string | null;
//   min_weight?: number;
//   max_weight?: number;
//   height?: string | null;
//   min_height?: number;
//   max_height?: number;
//   life_span?: string;
//   min_life_span?: number;
//   max_life_span?: number;
//   reference_image_id?: string;
// };

export interface Weight {
  imperial?: string;
  metric?: string;
}

export interface Height {
  imperial?: string;
  metric?: string;
}

export interface Image {
  id: string;
  width: number;
  height: number;
  url: string;
}

export interface Temperament {
  name: string;
  // temperament: string[];
}

export interface DogtypeAll {
  reference_image_id?: string;
  id: string;
  name: string;
  weight?: string;
  height?: string;
  life_span?: string;
  min_height?: number;
  max_height?: number;
  min_weight?: number;
  max_weight?: number;
  min_life_span?: number;
  max_life_span?: number;
  image: string | Image;
  temperament?: string;
}

export const formatDetailedDogs = function (
  array: DogtypeAll[],
  place = "api"
) {
  //place = "api" (default) or "db". Formats the response object with the detailed data hence the dogs from the db and the dogs from the api have the same attributes, and the values are in the same format.

  if (place !== "api") {
    return array.map(
      (dog: any) =>
        (dog = {
          id: dog.id,
          name: dog.name,
          image: dog.image,
          weight: `${dog.min_weight}-${dog.max_weight}`,
          height: `${dog.min_height}-${dog.max_height}`,
          life_span: `${dog.min_life_span}-${dog.max_life_span}`,
          temperament: dog.temperament?.map((t: { name: string }) => t.name),
        })
    );
  }
  return array.map(
    (dog: any) =>
      (dog = {
        id: dog.id,
        name: dog.name.replace(/[^a-zA-Z ]/g, ""), //get rid of the parentheses in some names
        weight: !dog.weight.metric
          ? dog.weight.imperial //If the metric weight is unavailabe (it appears as NaN in the response object) get the imperial weight
          : dog.weight.metric,
        image: `https://cdn2.thedogapi.com/images/${dog.reference_image_id}.jpg`,
        height: dog.height.metric,
        life_span: dog.life_span,
        temperament: dog.temperament?.split(", "),
      })
  );
};

export const getDogs = async function (name?: string) {
  if (name) {
    name = `${name[0].toUpperCase()}${name.slice(1).toLowerCase()}`; //first letter in uppercase and the rest in lowercase
    const breedName = await axios.get(`${BASE_URL}/search?q=${name}`);
    if (!breedName) throw new Error("Breed not found");

    const dogsApi = formatDetailedDogs(breedName.data);
    const dogsDb: any = await prisma.dog.findMany({
      where: { name: name },
      include: {
        temperament: {
          select: { name: true },
        },
      },
    });

    const allDogs = formatDetailedDogs(dogsDb, "db").concat(dogsApi);
    return allDogs;
  }
  const dogsApi = await axios.get(BASE_URL);
  const dogsApiFiltered = formatDetailedDogs(dogsApi.data);
  const dogsDb: any = await prisma.dog.findMany({
    include: {
      temperament: {
        select: { name: true },
      },
    },
  });
  const allDogs = formatDetailedDogs(dogsDb, "db").concat(dogsApiFiltered);
  return allDogs;
};

export const formatDogs = async function (array: DogtypeAll[]) {
  //return only the data needed for the main route (id, name, weight, temperaments)
  return array.map((dog) => {
    let { height, life_span, ...rest } = dog;
    return rest;
  });
};

export const getDogsId = async function (name?: string | string[]) {
  const dogs = await getDogs();
  const dog = dogs.find((dog: DogtypeAll) => dog.name === name);
  if (!dog) throw new Error("id not found");
  return dog;
};
