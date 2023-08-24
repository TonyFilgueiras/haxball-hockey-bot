import hockeyMap from "./hockey.json"

export default function getPenaltyBox() {
    const penaltybox = hockeyMap.segments.filter((segment) => segment.v0 == 215 || segment.v0 == 216)
    console.log(penaltybox)
    return penaltybox
}

// { "v0" : 215, "v1" : 216, "curve" : 0, "vis" : true, "color" : "ffff00", "cMask" : ["red","blue" ], "y" : 350 },
// { "v0" : 216, "v1" : 217, "curve" : 0, "vis" : true, "color" : "ffff00", "cMask" : ["red","blue" ] },
// { "v0" : 215, "v1" : 218, "curve" : 0, "vis" : true, "color" : "ffff00", "cMask" : ["red","blue" ] }