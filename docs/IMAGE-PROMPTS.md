# Service image prompts

The site currently uses the 11 service illustrations that were already in the project (consistent dark line-art, one per service).
To switch to photography, generate each image below and replace **both** files for that service — no code changes are needed:

- `assets/img/services/<name>.webp` — 1600 × 900, WebP, quality ~80
- `assets/img/services/<name>-800.webp` — 800 × 450, WebP, quality ~80

Keep lighting and colour grading consistent across all 11 (a dusk/night palette with warm accent lighting matches the site best).
Where an eVTOL appears, use the six-rotor VAYUPORT aircraft from the hero video as the reference. Do not reuse Skyports/Lyneports imagery.
After replacing, update the `alt` text for that service in the HTML if the new picture shows something different.

## service-01-helipad-conversion 

A realistic existing rooftop helipad being upgraded into a modern electric vertical takeoff and landing vertiport, advanced landing pad markings, safety perimeter, passenger access infrastructure, charging equipment, premium airport architecture, realistic Indian urban environment, cinematic architectural photography, 16:9 landscape, no text, no logos.

## service-02-vertiport-consultancy

Professional aviation infrastructure consultants examining an existing helipad, reviewing architectural drawings and a 3D vertiport development model, modern airport surroundings, glass conference room, realistic engineers and technical planning equipment, cinematic corporate photography, 16:9, no text.

## service-03-helipad-site-selection

Aerial architectural visualization of a proposed helipad development site with surrounding terrain, access roads, topographical landscape, survey professionals and infrastructure planning, realistic Indian geographical context, premium aerial photography, 16:9, no text.

## service-04-hybrid-helipad

A modern hybrid aviation facility combining conventional helicopter infrastructure and future eVTOL landing infrastructure, landscaped surroundings, sustainable design, solar canopies, realistic airport architecture, cinematic daylight, 16:9, no text.

## service-05-infrastructure-construction

A photorealistic aviation infrastructure construction site showing engineers, civil contractors, concrete landing pad construction, steel structural work, modern aviation infrastructure and construction machinery, premium architectural documentary photography, 16:9, no text.

## service-06-operations-management

A modern operational vertiport with trained ground personnel coordinating passenger movement, aircraft parking, landing pad operations, safety monitoring and terminal activities, premium airport atmosphere, photorealistic, 16:9, no text.

## service-07-infrastructure-maintenance

Professional aviation infrastructure maintenance engineers inspecting a modern vertiport, electrical systems, lighting, charging equipment, landing pad surface and technical maintenance equipment, realistic industrial aviation environment, 16:9, no text.

## service-08-manpower-deployment

Professionally trained aviation ground staff wearing appropriate safety uniforms, coordinating vertiport operations, conducting inspections and supporting passenger movement near a modern eVTOL facility, realistic professional aviation photography, 16:9, no text.

## service-09-airspace-planning

A professional aviation planning environment displaying a realistic digital airspace visualization, proposed flight corridors, geographical terrain, airspace sectors and aviation planning screens, engineers reviewing operational scenarios, photorealistic, 16:9, no readable text.

## service-10-air-traffic-management

Modern air traffic management control room with aviation professionals monitoring radar displays, airspace visualization and proposed vertiport operational coordination, realistic professional control centre, cinematic lighting, 16:9, no readable text.

## service-11-atc-coordination

Professional aviation stakeholders and infrastructure consultants reviewing airport layouts, airspace planning documents and proposed vertiport infrastructure in a modern aviation conference room, realistic corporate photography, 16:9, no logos or readable text.

## Converting with Python (Pillow)

```python
from PIL import Image
im = Image.open('generated.png').convert('RGB')
im.resize((1600, 900), Image.LANCZOS).save('service-XX-name.webp', 'WEBP', quality=80, method=6)
im.resize((800, 450), Image.LANCZOS).save('service-XX-name-800.webp', 'WEBP', quality=80, method=6)
```
