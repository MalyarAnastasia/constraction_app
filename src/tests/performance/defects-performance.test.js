
describe('Defects Performance Tests', () => {
  test('filters defects data efficiently', () => {
    const generateDefects = (count) => {
      return Array.from({ length: count }, (_, i) => ({
        defect_id: i + 1,
        title: `Test Defect ${i + 1}`,
        project_name: `Project ${i % 10}`,
        priority: ['Low', 'Medium', 'High', 'Critical'][i % 4],
        status_name: ['Open', 'In Progress', 'Resolved'][i % 3],
        assignee_name: `User ${i % 20}`,
        created_at: '2024-01-01',
      }));
    };

    const defects = generateDefects(1000);
    
    const startTime = performance.now();
    
    const highPriorityDefects = defects.filter(defect => defect.priority === 'High');
    const openDefects = defects.filter(defect => defect.status_name === 'Open');
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;

    expect(highPriorityDefects.length).toBe(250);
    expect(openDefects.length).toBeGreaterThan(0);
    expect(processingTime).toBeLessThan(100); 
  });

  test('transforms defect data within acceptable time', () => {
    const defects = Array.from({ length: 500 }, (_, i) => ({
      defect_id: i + 1,
      title: `Defect ${i + 1}`,
      priority: 'High',
      created_at: '2024-01-01',
    }));

    const startTime = performance.now();
    const transformed = defects.map(defect => ({
      id: defect.defect_id,
      title: defect.title,
      priority: defect.priority,
      priorityLabel: defect.priority === 'High' ? 'Высокий' : 'Низкий',
      formattedDate: new Date(defect.created_at).toLocaleDateString('ru-RU')
    }));

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    expect(transformed.length).toBe(500);
    expect(processingTime).toBeLessThan(200); 
  });

  test('handles array operations without memory issues', () => {
    const largeDataset = Array.from({ length: 2000 }, (_, i) => ({
      defect_id: i + 1,
      title: `Defect ${i + 1}`,
      priority: ['Low', 'Medium', 'High'][i % 3],
    }));

    const operations = [
      () => largeDataset.filter(d => d.priority === 'High'),
      () => largeDataset.map(d => ({ ...d, processed: true })),
      () => largeDataset.slice(0, 100),
      () => [...largeDataset].sort((a, b) => a.defect_id - b.defect_id)
    ];

    operations.forEach(operation => {
      const startTime = performance.now();
      const result = operation();
      const endTime = performance.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(500); 
    });
  });
});