const MapMeasures = {
    EndZoneRed: [
        { x: -930, y: -333 },
        { x: -775, y: 333 }
    ],
    EndZoneBlue: [
        { x: 930, y: -333 },
        { x: 775, y: 333 }
    ],
    RedZoneRed: [
        { x: -775, y: -333 },
        { x: -462, y: 333 }
    ],
    RedZoneBlue: [
        { x: 775, y: 333 },
        { x: 462, y: -333 }
    ],
    InnerField: [
        { x: -775, y: -333 },
        { x: 775, y: 333 }
    ],
    OuterField: [
        { x: -930, y: -333 },
        { x: 930, y: 333 }
    ],
    RedGoalLine: [
        { x: -930, y: -60 },
        { x: -930, y: 60 }
    ],
    BlueGoalLine: [
        { x: 930, y: -60 },
        { x: 930, y: 60 }
    ],
    GoalPostRadius: 4,
    HashesHeight: {
        y1: -80,
        y2: 80
    },
    SingleHashHeight: 20,
    RedEndZoneStartPositionX: -775,
    BlueEndZoneStartPositionX: 775,
    RedEndZoneLineCenter: { x: -775, y: 0 },
    BlueEndZoneLineCenter: { x: 775, y: 0 },
    PuntRedPositionX: -980,
    PuntBluePositionX: 980,
    KickoffKickingPositionX: 465,
    KickoffReceivingPositionX: 775,
    Yard: 15.5,
    HashSubdivision: 31,
    YardsBetween0MarkAndGoalLine: 10
};

export default MapMeasures;
