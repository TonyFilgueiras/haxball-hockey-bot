import Room from "./Room";
import Settings from "./Settings";

export default abstract class Segments {
  public v0 : number
  public v1 : number
  public curve : number
  public cMask: string[] = []
  
  public x : number
  public y : number
}