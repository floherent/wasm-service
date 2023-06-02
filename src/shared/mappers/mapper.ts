export abstract class Mapper<From, To> {
  abstract map(from: From): To;
  abstract mapAll(froms: From[]): To[];
}

export abstract class AbstractMapper<From, To> extends Mapper<From, To> {
  mapAll(froms: From[]): To[] {
    return froms.map((from) => this.map(from));
  }
}

export abstract class EntityModelMapper<Entity, Model> {
  abstract toModel(from: Entity): Model;
  abstract toEntity(from: Model): Entity;
}
