import Slider from "react-slick";
import Banner1 from "../../assets/images/banner1.jpg";
import Banner2 from "../../assets/images/banner2.jpg";
import Banner3 from "../../assets/images/banner3.jpg";
import Banner4 from "../../assets/images/banner3.jpg";

const sliderImages = [
  {
    image: Banner4,
    title: "",
    link: "",
    buttonTxt: "",
  },
  {
    image: Banner1,
    title: "",
    link: "",
    buttonTxt: "",
  },
  {
    image: Banner2,
    title: "",
    link: "",
    buttonTxt: "",
  },
  {
    image: Banner3,
    title: "",
    link: "",
    buttonTxt: "",
  },
  
];

const HomeSlider = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3500,
    arrows: true,
  };

  

  return (
    <Slider {...settings}>
      {sliderImages.map((slide, index) => (
        <div key={index} className="relative">
          <img
            src={slide.image}
            alt={`slide-${index}`}
            className="w-full h-[60vh] object-cover"
          />
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/40 px-4 text-white text-center">
            {slide.title && (
              <h2 className="mb-4 font-bold text-2xl md:text-4xl">
                {slide.title}
              </h2>
            )}
            {slide.buttonTxt && slide.link && (
              <a
                href={slide.link}
                className="bg-accent hover:bg-[#ffc700] px-5 py-3 rounded-md font-semibold text-black transition"
              >
                {slide.buttonTxt}
              </a>
            )}
          </div>
        </div>
      ))}
    </Slider>
  );
};

export default HomeSlider;
