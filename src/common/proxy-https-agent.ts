import AgentKeepAlive from "agentkeepalive";

export class ProxyHttpsAgent extends AgentKeepAlive.HttpsAgent {
  // TODO
  // public getName(option: any): string {
  //   let name = HttpsAgentOrigin.prototype.getName.call(this, option);
  //   name += ':';
  //   if (option.customSocketId) {
  //     name += option.customSocketId;
  //   }
  //   return name;
  // }
}
