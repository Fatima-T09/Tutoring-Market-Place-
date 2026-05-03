const Datastore = require('nedb-promises');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
require('fs').mkdirSync(DATA_DIR, { recursive: true });

const db = {
  users:    Datastore.create({ filename: path.join(DATA_DIR, 'users.db'),    autoload: true }),
  tutors:   Datastore.create({ filename: path.join(DATA_DIR, 'tutors.db'),   autoload: true }),
  sessions: Datastore.create({ filename: path.join(DATA_DIR, 'sessions.db'), autoload: true }),
  messages: Datastore.create({ filename: path.join(DATA_DIR, 'messages.db'), autoload: true }),
  ratings:  Datastore.create({ filename: path.join(DATA_DIR, 'ratings.db'),  autoload: true }),
};

async function seed() {
  const count = await db.users.count({});
  if (count > 0) { console.log('DB already seeded.'); return; }

  const tutorPass  = bcrypt.hashSync('tutor123', 10);
  const studentPass = bcrypt.hashSync('student123', 10);
  const adminPass  = bcrypt.hashSync('admin123', 10);

  await db.users.insert([
    { _id:'admin-001',   username:'admin',          email:'admin@tutormarket.com',   password:adminPass,   role:'admin',   createdAt:new Date() },
    { _id:'student-001', username:'demo_student',   email:'student@tutormarket.com', password:studentPass, role:'student', createdAt:new Date() },
    { _id:'tutor-001',   username:'fatima_tahir',   email:'fatima@tutormarket.com',  password:tutorPass,   role:'tutor',   createdAt:new Date() },
    { _id:'tutor-002',   username:'jordan_mitchell', email:'jordan@tutormarket.com', password:tutorPass,   role:'tutor',   createdAt:new Date() },
    { _id:'tutor-003',   username:'youmei_xu',      email:'youmei@tutormarket.com',  password:tutorPass,   role:'tutor',   createdAt:new Date() },
  ]);

  await db.tutors.insert([
    {
      _id:'tp-001', userId:'tutor-001', subject:'Computer Science',
      bio:'PhD in Computer Science from MIT. Specialized in algorithms, data structures, Python, Java, and web development. 8+ years of teaching experience. My approach focuses on practical problem-solving and building a strong conceptual foundation.',
      hourlyRate:75.0, rating:4.9, totalReviews:127,
      availability:{
        monday:['09:00','10:00','11:00','14:00','15:00','16:00'],
        tuesday:['09:00','10:00','14:00','15:00'],
        wednesday:['10:00','11:00','14:00','15:00','16:00'],
        thursday:['09:00','10:00','11:00'],
        friday:['14:00','15:00','16:00'],
        saturday:['10:00','11:00'],
        sunday:[]
      }
    },
    {
      _id:'tp-002', userId:'tutor-002', subject:'Mathematics',
      bio:'Masters in Applied Mathematics from Stanford. Expert in calculus, linear algebra, statistics, and discrete mathematics. I make abstract concepts tangible through real-world examples and step-by-step problem solving.',
      hourlyRate:65.0, rating:4.8, totalReviews:203,
      availability:{
        monday:['08:00','09:00','10:00','15:00','16:00','17:00'],
        tuesday:['08:00','09:00','10:00','15:00','16:00','17:00'],
        wednesday:['08:00','09:00'],
        thursday:['15:00','16:00','17:00'],
        friday:['08:00','09:00','10:00'],
        saturday:['09:00','10:00','11:00','12:00'],
        sunday:['10:00','11:00']
      }
    },
    {
      _id:'tp-003', userId:'tutor-003', subject:'Physics',
      bio:'PhD candidate in Theoretical Physics at Caltech. Specializing in mechanics, electromagnetism, quantum physics, and thermodynamics. I use visual aids and real experiments to make physics intuitive and exciting.',
      hourlyRate:70.0, rating:4.7, totalReviews:89,
      availability:{
        monday:['13:00','14:00','15:00'],
        tuesday:['13:00','14:00','15:00','16:00'],
        wednesday:['13:00','14:00'],
        thursday:['13:00','14:00','15:00','16:00'],
        friday:['13:00','14:00','15:00'],
        saturday:['11:00','12:00','13:00'],
        sunday:['11:00','12:00']
      }
    }
  ]);

  // Ensure unique indexes
  await db.users.ensureIndex({ fieldName: 'email', unique: true });
  await db.users.ensureIndex({ fieldName: 'username', unique: true });

  console.log('✅ Database seeded with demo accounts.');
}

seed().catch(console.error);

module.exports = db;
