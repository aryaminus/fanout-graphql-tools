import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { split } from "apollo-link";
import { createHttpLink } from "apollo-link-http";
import { WebSocketLink } from "apollo-link-ws";
import { getMainDefinition } from "apollo-utilities";
import fetch from "cross-fetch";
import * as WebSocket from "ws";

/** Info about what URLs ApolloClient should connect to */
export interface IApolloServerUrlInfo {
  /** path to make subscriptions connections to */
  subscriptionsUrl: string;
  /** http path for graphql query/mutation endpoint */
  url: string;
}

const WebSocketApolloClient = ({
  url,
  subscriptionsUrl,
}: IApolloServerUrlInfo) => {
  const httpLink = createHttpLink({
    fetch: async (input, init) => {
      const response = await fetch(input, init);
      return response;
    },
    uri: url,
  });
  const wsLink = new WebSocketLink({
    options: {
      reconnect: true,
      timeout: 999999999,
    },
    uri: subscriptionsUrl,
    webSocketImpl: WebSocket,
  });
  const link = split(
    // split based on operation type
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === "OperationDefinition" &&
        definition.operation === "subscription"
      );
    },
    wsLink,
    httpLink,
  );
  const apolloClient = new ApolloClient({
    cache: new InMemoryCache(),
    link,
  });
  return apolloClient;
};

export default WebSocketApolloClient;
