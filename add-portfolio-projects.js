// Script to add 10 portfolio projects to the database
const API_URL = '/api/99ddd15c-93b5-4d9e-8536-31e6f6630304';

const projects = [
  {
    title: "Бизнес",
    description: "Корпоративный сайт для современной компании",
    image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/ba6e42d5-4e17-4641-9ae8-1a5a9d9fc0d2.jpg",
    carousel_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/ba6e42d5-4e17-4641-9ae8-1a5a9d9fc0d2.jpg",
    preview_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/ba6e42d5-4e17-4641-9ae8-1a5a9d9fc0d2.jpg",
    website_url: "https://example.com",
    display_order: 1,
    is_active: true
  },
  {
    title: "Магазин",
    description: "Интернет-магазин одежды с корзиной",
    image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/5a5507c6-7b85-4abf-ada5-95e3b2576b3e.jpg",
    carousel_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/5a5507c6-7b85-4abf-ada5-95e3b2576b3e.jpg",
    preview_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/5a5507c6-7b85-4abf-ada5-95e3b2576b3e.jpg",
    website_url: "https://example.com",
    display_order: 2,
    is_active: true
  },
  {
    title: "Ресторан",
    description: "Сайт кафе с меню и бронированием",
    image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/506a6879-dc0a-4d61-a205-c1ad50737991.jpg",
    carousel_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/506a6879-dc0a-4d61-a205-c1ad50737991.jpg",
    preview_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/506a6879-dc0a-4d61-a205-c1ad50737991.jpg",
    website_url: "https://example.com",
    display_order: 3,
    is_active: true
  },
  {
    title: "Недвижимос",
    description: "Портал продажи и аренды жилья",
    image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/3c2e9a14-d40d-4211-928f-ef42d7d597b8.jpg",
    carousel_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/3c2e9a14-d40d-4211-928f-ef42d7d597b8.jpg",
    preview_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/3c2e9a14-d40d-4211-928f-ef42d7d597b8.jpg",
    website_url: "https://example.com",
    display_order: 4,
    is_active: true
  },
  {
    title: "Фитнес",
    description: "Сайт спортивного клуба",
    image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/abd991a2-61ff-4ce4-81f6-0c16deac31bb.jpg",
    carousel_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/abd991a2-61ff-4ce4-81f6-0c16deac31bb.jpg",
    preview_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/abd991a2-61ff-4ce4-81f6-0c16deac31bb.jpg",
    website_url: "https://example.com",
    display_order: 5,
    is_active: true
  },
  {
    title: "Портфолио",
    description: "Сайт-портфолио фотографа",
    image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/440ad0e7-b266-4bae-b5be-703c7f0f4f5b.jpg",
    carousel_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/440ad0e7-b266-4bae-b5be-703c7f0f4f5b.jpg",
    preview_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/440ad0e7-b266-4bae-b5be-703c7f0f4f5b.jpg",
    website_url: "https://example.com",
    display_order: 6,
    is_active: true
  },
  {
    title: "Клиника",
    description: "Медицинский центр с записью",
    image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/a33e4224-b580-42ec-9244-3f48b2bbe727.jpg",
    carousel_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/a33e4224-b580-42ec-9244-3f48b2bbe727.jpg",
    preview_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/a33e4224-b580-42ec-9244-3f48b2bbe727.jpg",
    website_url: "https://example.com",
    display_order: 7,
    is_active: true
  },
  {
    title: "Туризм",
    description: "Турагентство с бронированием туров",
    image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/87e387c7-ccaf-451a-989a-6139711c1282.jpg",
    carousel_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/87e387c7-ccaf-451a-989a-6139711c1282.jpg",
    preview_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/87e387c7-ccaf-451a-989a-6139711c1282.jpg",
    website_url: "https://example.com",
    display_order: 8,
    is_active: true
  },
  {
    title: "Обучение",
    description: "Онлайн-платформа для курсов",
    image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/5e0a62e9-97a5-4a2e-b05b-3c655b667205.jpg",
    carousel_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/5e0a62e9-97a5-4a2e-b05b-3c655b667205.jpg",
    preview_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/5e0a62e9-97a5-4a2e-b05b-3c655b667205.jpg",
    website_url: "https://example.com",
    display_order: 9,
    is_active: true
  },
  {
    title: "Стартап",
    description: "SaaS продукт для бизнеса",
    image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/67f5a6f4-3dd7-45c6-b1e4-6d17edd877b3.jpg",
    carousel_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/67f5a6f4-3dd7-45c6-b1e4-6d17edd877b3.jpg",
    preview_image_url: "/img/projects/491de3c4-a729-4b5f-9bf5-fdd45113abfc/files/67f5a6f4-3dd7-45c6-b1e4-6d17edd877b3.jpg",
    website_url: "https://example.com",
    display_order: 10,
    is_active: true
  }
];

async function addProject(project, index) {
  try {
    console.log(`\nAdding project ${index + 1}/10: ${project.title}`);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✓ Success: "${project.title}" added with ID ${result.id || 'N/A'}`);
      return { success: true, project: project.title };
    } else {
      const errorText = await response.text();
      console.error(`✗ Failed: "${project.title}" - Status ${response.status}: ${errorText}`);
      return { success: false, project: project.title, error: `Status ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error(`✗ Error adding "${project.title}":`, error.message);
    return { success: false, project: project.title, error: error.message };
  }
}

async function addAllProjects() {
  console.log('Starting to add 10 portfolio projects...');
  console.log('API URL:', API_URL);
  
  const results = [];
  
  for (let i = 0; i < projects.length; i++) {
    const result = await addProject(projects[i], i);
    results.push(result);
    // Add a small delay between requests to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✓ Successfully added: ${successful.length} projects`);
  if (successful.length > 0) {
    successful.forEach(r => console.log(`  - ${r.project}`));
  }
  
  if (failed.length > 0) {
    console.log(`\n✗ Failed to add: ${failed.length} projects`);
    failed.forEach(r => console.log(`  - ${r.project}: ${r.error}`));
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the script
addAllProjects().catch(console.error);