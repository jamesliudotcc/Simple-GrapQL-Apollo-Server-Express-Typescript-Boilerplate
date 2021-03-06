import { ForbiddenError, ValidationError } from 'apollo-server';
import * as argon2 from 'argon2';
import { find } from 'lodash';

import { generateJwt } from './generateJwt';
import { User, users } from './users';

export const resolvers = {
  Query: {
    hello: () => 'world',
    users: () => users,
    user: (_: any, args: { id: number }) => find(users, { id: args.id }),
    secret: (root: any, args: any, context: any) => {
      if (!context.user) throw new ForbiddenError('No secret for you');
      return 'secret';
    },
  },
  Mutation: {
    login: async (_: any, { email, password }: User) => {
      const foundUser = find(users, { email: email });

      if (foundUser && (await argon2.verify(foundUser.password, password))) {
        return {
          token: generateJwt(foundUser),
          user: { ...foundUser, password: '' },
        };
      }
    },
    register: async (_: any, { email, password, name }: User) => {
      if (users.reduce((_, user) => email === user.email, false)) {
        throw new ValidationError('Email already exists');
      }

      const hashedPass = await argon2.hash(password);

      const newUser = {
        email,
        name,
        password: hashedPass,
        id: users.length + 1,
      };
      users.push(newUser);
      return {
        token: generateJwt(newUser),
        user: { ...newUser, password: 'haha, no' },
      };
    },
  },
};
