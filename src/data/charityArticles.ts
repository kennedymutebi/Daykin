
export interface CharityCase {
  id: number;
  category: string;
  categoryColor: string;
  title: string;
  excerpt: string;
  author: string;
  authorInitials: string;
  authorColor: string;
  readTime: string;
  date: string;
  img: string;
  verified?: boolean;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
  body?: string[];
  // Charity-specific fields
  beneficiary: string;
  location: string;
  goal: number;       // target amount in USD
  raised: number;     // amount raised so far
  donors: number;     // number of donors
  urgent: boolean;
  tag: "Medical" | "Education" | "Shelter" | "Food" | "Disaster" | "Child";
}

export const CHARITY_CASES: CharityCase[] = [
  {
    id: 201,
    category: "Medical",
    categoryColor: "#F59E0B",
    title: "Grace Needs a Heart Surgery She Cannot Afford",
    excerpt:
      "At 7 years old, Grace has already survived two cardiac episodes. Her parents are subsistence farmers in rural Uganda. Without surgery in the next 60 days, doctors say her prognosis is critical.",
    author: "Dr. Amara Osei",
    authorInitials: "AO",
    authorColor: "#F59E0B",
    readTime: "4 min read",
    date: "Apr 15, 2026",
    img: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&q=75",
    verified: true,
    engagement: { likes: 4820, comments: 312, shares: 1430, views: 28000 },
    beneficiary: "Grace Nakato, Age 7",
    location: "Kampala, Uganda",
    goal: 18000,
    raised: 11240,
    donors: 387,
    urgent: true,
    tag: "Medical",
    body: [
      "Grace was born with a congenital heart defect that went undetected for her first three years of life. Her parents, subsistence farmers in the Masaka district, noticed she tired easily and struggled to keep up with other children. By the time she reached a clinic, the condition had progressed significantly.",
      "Dr. Samuel Kizito, the cardiologist at Mulago National Referral Hospital who has been treating Grace, says the window for intervention is closing. 'She needs an open-heart procedure to repair the septal defect. Without it, we are looking at irreversible pulmonary damage within months.'",
      "The surgery costs $18,000 — a sum that represents more than twenty years of income for Grace's family. Her mother, Prossy, has already sold the family's livestock and borrowed from every relative she has. She is $6,760 short.",
      "Grace herself is a girl of extraordinary composure. She knows she is sick. She asks her mother not to cry in front of her. She has a dog-eared exercise book in which she writes stories about what she will do when she is well. The most recent entry reads: 'I will run a race and I will win it.'",
    ],
  },
  {
    id: 202,
    category: "Education",
    categoryColor: "#F59E0B",
    title: "40 Children Share One Classroom With No Roof",
    excerpt:
      "When it rains in Karamoja, school stops. The children sit in the mud and wait. A permanent classroom block would cost $8,000 and serve this community for a generation.",
    author: "Faith Apio",
    authorInitials: "FA",
    authorColor: "#F59E0B",
    readTime: "5 min read",
    date: "Apr 13, 2026",
    img: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800&q=75",
    verified: true,
    engagement: { likes: 3210, comments: 198, shares: 876, views: 19000 },
    beneficiary: "Nakitooma Primary School",
    location: "Karamoja, Uganda",
    goal: 8000,
    raised: 5430,
    donors: 214,
    urgent: false,
    tag: "Education",
    body: [
      "The school was built in 2019 by parents who carried the bricks themselves from a riverbed four kilometres away. They had enough materials for walls but ran out of money before they could roof it. A tarpaulin has covered the structure since then — a temporary solution that has outlasted three rainy seasons.",
      "The tarpaulin leaks. When the rains come, which in Karamoja is unpredictably and violently, the 40 children who share this room cannot study. The teacher, Beatrice Akello, has been teaching for eleven years, seven of them here. She keeps a second set of lesson plans for rainy days — shorter, designed to be delivered in the covered corridor outside.",
      "'The children do not complain,' she says. 'They come every day. They are hungry for learning in a way that children who have schools take for granted.' She has sent four students on to secondary school in the past three years, which she considers her proudest achievement.",
      "The cost of a permanent corrugated iron roof, concrete reinforcement, and basic furniture for this classroom is $8,000. The community has contributed $2,000 in labour and materials. The remaining $6,000 would complete a structure that could last 30 years.",
    ],
  },
  {
    id: 203,
    category: "Medical",
    categoryColor: "#F59E0B",
    title: "James Lost Both Legs to Diabetes. Now He Needs Prosthetics.",
    excerpt:
      "A 34-year-old father of three had both legs amputated after delayed diagnosis. With prosthetics, he can work again. Without them, his family has no income and no hope.",
    author: "Michael Tumwine",
    authorInitials: "MT",
    authorColor: "#F59E0B",
    readTime: "6 min read",
    date: "Apr 11, 2026",
    img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=75",
    verified: false,
    engagement: { likes: 2890, comments: 241, shares: 654, views: 15000 },
    beneficiary: "James Ssebulime, Age 34",
    location: "Jinja, Uganda",
    goal: 6500,
    raised: 2180,
    donors: 97,
    urgent: true,
    tag: "Medical",
    body: [
      "James Ssebulime was a bricklayer — a good one, known across his neighbourhood for the straightness of his lines. Two years ago, he noticed a wound on his left foot that would not heal. By the time he reached a hospital, the infection had spread. First his left leg, then his right, were amputated below the knee.",
      "He spent fourteen months in hospital and rehabilitation. His wife, Judith, took on three domestic jobs to keep their children fed. Their eldest, a 12-year-old named Emmanuel, stopped attending school to help his mother at home.",
      "The prosthetics James needs are not luxury items — they are the functional, robust kind designed for active use in difficult environments. They cost $6,500. With them, he can return to bricklaying. Without them, he is confined to a wheelchair that the family borrowed and may soon need to return.",
      "'I do not want sympathy,' James said in the interview. 'I want to work. Give me my legs and I will do the rest.' Emmanuel, sitting nearby, nodded at this with an expression that suggested he had heard it before and still believed it completely.",
    ],
  },
  {
    id: 204,
    category: "Child",
    categoryColor: "#F59E0B",
    title: "Twelve Orphaned Siblings Are About to Lose Their Home",
    excerpt:
      "When their parents died within six months of each other, these children stayed together. Their aunt has sheltered them for two years. Her lease ends next month.",
    author: "Rose Nakigozi",
    authorInitials: "RN",
    authorColor: "#F59E0B",
    readTime: "5 min read",
    date: "Apr 9, 2026",
    img: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=75",
    verified: true,
    engagement: { likes: 6740, comments: 503, shares: 1890, views: 41000 },
    beneficiary: "The Namukasa Children",
    location: "Entebbe, Uganda",
    goal: 12000,
    raised: 8970,
    donors: 542,
    urgent: true,
    tag: "Child",
    body: [
      "Their father died of liver cancer in March 2024. Their mother, unable to recover from the grief and the burden, died of what the doctors called heart failure five months later. Twelve children, aged between 4 and 17, were left in a two-room house with no adult and no income.",
      "Their aunt, Josephine Nakaweesi, was the first family member to arrive. She had her own children, her own rent, her own fragile budget. She took all twelve in anyway. 'They are my sister's children,' she said, as though this settled the question completely.',",
      "For two years, Josephine has stretched a teacher's salary across fifteen mouths. She has not bought herself new clothes since 2023. She wakes at 4:30 every morning to cook before school and sleeps last. The landlord has given her one more month.",
      "The funds raised would cover two years of rent on a larger property, school fees for all twelve children for one academic year, and a small stock of supplies for a food stall that Josephine wants to start. 'I am not asking anyone to solve everything,' she says. 'Just give us time to get on our feet.'",
    ],
  },
  {
    id: 205,
    category: "Food",
    categoryColor: "#F59E0B",
    title: "A Village of 300 Has Not Had a Proper Meal in 11 Days",
    excerpt:
      "After flooding destroyed their harvest, the Buyende fishing community is surviving on one meal every two days. Children are showing signs of acute malnutrition.",
    author: "Peter Wandera",
    authorInitials: "PW",
    authorColor: "#F59E0B",
    readTime: "4 min read",
    date: "Apr 7, 2026",
    img: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=75",
    verified: false,
    engagement: { likes: 5120, comments: 389, shares: 1240, views: 33000 },
    beneficiary: "Buyende Fishing Community",
    location: "Buyende, Uganda",
    goal: 5000,
    raised: 4120,
    donors: 301,
    urgent: true,
    tag: "Food",
    body: [
      "The floods came on a Tuesday night in late March. By Wednesday morning, three months of stored grain — the community's buffer against the hungry season — had been destroyed. The fishing boats, which represented the other main livelihood, were damaged or swept away entirely.",
      "The local health worker, Immaculate Byaruhanga, has been documenting nutritional status since the floods. She has identified 23 children under five showing signs of acute malnutrition. 'We are not yet at the crisis point,' she says, 'but we are days away from it, not weeks.'",
      "The community has received no government assistance. The district response team, stretched across multiple flood-affected zones, has not yet reached Buyende. The village elder, 71-year-old Yozefu Kabugo, says it is the worst thing he has seen in his lifetime.",
      "The $5,000 target would fund an emergency food distribution covering the entire community for six weeks — enough time for the immediate crisis to pass and for some fishing activity to resume. The operation is being coordinated by a local NGO with existing presence in the district.",
    ],
  },
  {
    id: 206,
    category: "Shelter",
    categoryColor: "#F59E0B",
    title: "Sarah and Her Four Children Sleep Under a Tree",
    excerpt:
      "Evicted after her husband's death, Sarah has been sheltering her children under a mango tree for three weeks. The rainy season begins in 10 days.",
    author: "Agnes Namutebi",
    authorInitials: "AN",
    authorColor: "#F59E0B",
    readTime: "4 min read",
    date: "Apr 5, 2026",
    img: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=75",
    verified: true,
    engagement: { likes: 7830, comments: 612, shares: 2100, views: 52000 },
    beneficiary: "Sarah Nalwoga & Children",
    location: "Wakiso, Uganda",
    goal: 3500,
    raised: 3180,
    donors: 428,
    urgent: true,
    tag: "Shelter",
    body: [
      "Sarah Nalwoga's husband died in January. Within three weeks, his brothers arrived at the house and told her it was family property. She had no documentation, no legal standing, and no money for a lawyer. She left with her four children and the clothes they were wearing.",
      "She has been staying in the compound of a distant neighbour, sleeping under a large mango tree that provides some shelter. The neighbour is not unkind but cannot offer more — their own house is a single room. Sarah has strung a plastic sheet between branches for some protection, but it is inadequate.",
      "Her eldest daughter, 14-year-old Winnie, has not been to school since the eviction. She stays with the younger children while Sarah looks for casual labour. On a good day, Sarah earns enough to buy one meal for five people.",
      "The funds would cover six months' rent on a one-room structure, basic bedding and kitchenware, and legal consultation fees to explore Sarah's options regarding the family property. 'I do not want charity forever,' she says. 'I want a door I can lock. That is all.'",
    ],
  },
];