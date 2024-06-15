# Haxball Hockey Bot

![Haxball Hockey Bot](hockeythumbnial.png)

- Bot designed to automatically enforce [hockey map rules](#rules) in the online game [Haxball](https://www.haxball.com/).

## Rules

Each team is entitled to one goalie.

### Goalie

- Can only touch the puck within their own area:

- in the attacking zone (in front of the midline),

- in the area behind their own goal,

- or after a teammate's touch.

### Player

- Cannot touch the puck within the defensive area,

- Cannot interfere with the opposing goalie if they are within their own area.

### Obs

- Any infraction caused will result in a **penalty** for the opponent.

- 1 pixel of the player inside the area is considered inside.

- 1 pixel of the goalie in front of the midline or behind the goal is also enough to avoid penalties.

### Penalty

- A player will drag the puck and then shoot it trying to score

- Once the puck its released from the player, he can't take possession of the puck again

- Only one player can take a penalty at a time

- If the player drags the puck backwards, its considered a missed penalty

- If the player drags the puck to the edge od the field, its considered a mised penalty


## Usage

### Download the repo

1. Click the `<> Code` box and then `Download ZIP`, or copy the git repository
2. Install [Node](https://nodejs.org/en)
3. Inside the repository folder run `npm install` to install the dependacies

### Get the token and run the bot

1. Go to https://www.haxball.com/headlesstoken
2. Click `Submit` to get the token
3. Copy the token without the `""` Ex: `thr1.AAAAAGZtqXpl72iLyo5Kaw.Zv_qup2vM5Q`
4. In the repository folder run the command `npm run open 'your_token'`


## Contributing

Contributions are welcome! If you encounter any issues, have suggestions for improvements, or would like to add new features, feel free to open an issue or submit a pull request.
