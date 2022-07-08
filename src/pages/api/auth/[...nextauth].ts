import { query as q } from "faunadb";
import NextAuth from "next-auth";
import GithubProviders from "next-auth/providers/github";
import { signIn } from "next-auth/react";

import { fauna } from "../../../services/fauna";

export default NextAuth({
  providers: [
    GithubProviders({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  jwt: {
    secret: process.env.FAUNADB_KEY,
  },

  callbacks: {
    async signIn(user) {
      const email = user.user.email;

      try {
        await fauna.query(
          q.If(
            q.Not(
                q.Exists(
                    q.Match(
                        q.Index("user_by_email"),
                        q.Casefold(user.user.email)
                    )
                )
            ),
              q.Create(
                  q.Collection("users"),
                  { data: { email } }
              ),
              q.Get(
                  q.Match(
                      q.Index("user_by_email"),
                      q.Casefold(user.user.email)
                  )
              )
          )
        );

          return true;
          
      } catch (error) {
        console.error(error);
        return false;
      }
    },
  },
  secret: process.env.FAUNADB_KEY,
});
